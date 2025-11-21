// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Импорты
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";

/**
 * @title ReputationReview
 * @author DeMarket Protocol Team
 * @notice Система децентрализованной репутации.
 * @dev Позволяет оставлять верифицированные отзывы по завершенным сделкам.
 */
contract ReputationReview is AccessControl, ReentrancyGuard {
    
    // =============================================================
    //                           ROLES
    // =============================================================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");

    // =============================================================
    //                           STATE
    // =============================================================

    /// @notice Структура для отслеживания статуса возможности оставить отзыв
    struct TradeStatus {
        address buyer;
        address seller;
        uint64 completedAt;
        bool buyerReviewed;
        bool sellerReviewed; // На будущее, если захотим двусторонние отзывы
    }

    /// @notice Данные сделки: EscrowId => TradeStatus
    /// @dev Мы храним здесь минимум данных для экономии газа. Остальное в Events.
    mapping(uint256 => TradeStatus) public tradeStatuses;

    /// @notice Время, в течение которого можно оставить отзыв после сделки (например, 30 дней)
    uint256 public reviewWindow;

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    constructor() {
        reviewWindow = 30 days; // Окно для отзыва по умолчанию
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        // MARKETPLACE_ROLE будет выдан позже через setMarketplace
    }

    // =============================================================
    //                  MARKETPLACE INTEGRATION
    // =============================================================

    /**
     * @notice Уведомление о завершении сделки.
     * @dev Вызывается ТОЛЬКО контрактом Marketplace при вызове confirmReceipt.
     * Открывает "окно" для написания отзыва.
     */
    function notifyTradeCompleted(
        uint256 _escrowId,
        address _buyer,
        address _seller
    ) external onlyRole(MARKETPLACE_ROLE) {
        tradeStatuses[_escrowId] = TradeStatus({
            buyer: _buyer,
            seller: _seller,
            completedAt: uint64(block.timestamp),
            buyerReviewed: false,
            sellerReviewed: false
        });

        // Эмитим событие, чтобы фронтенд знал, что кнопка "Оставить отзыв" активна
        emit Events.ReviewWindowOpened(_escrowId, _buyer, _seller);
    }

    // =============================================================
    //                     USER FUNCTIONS
    // =============================================================

    /**
     * @notice Оставить отзыв о сделке.
     * @param _escrowId ID завершенной сделки
     * @param _rating Рейтинг от 1 до 100 (где 100 = 5 звезд, 80 = 4 звезды и т.д.)
     * @param _commentCid IPFS хэш с текстом отзыва и (опционально) фото
     */
    function leaveReview(
        uint256 _escrowId,
        uint8 _rating,
        string calldata _commentCid
    ) external nonReentrant {
        TradeStatus storage trade = tradeStatuses[_escrowId];

        // 1. Проверка прав доступа
        // Сейчас реализовано только: Покупатель оценивает Продавца.
        if (msg.sender != trade.buyer) revert Errors.NotAuthorized();

        // 2. Проверка существования сделки и времени
        if (trade.completedAt == 0) revert Errors.TradeNotCompleted();
        if (block.timestamp > trade.completedAt + reviewWindow) revert Errors.ReviewWindowClosed();

        // 3. Проверка на повторный отзыв
        if (trade.buyerReviewed) revert Errors.ReviewAlreadySubmitted();

        // 4. Валидация рейтинга
        if (_rating == 0 || _rating > 100) revert Errors.InvalidRating();

        // 5. Обновление состояния
        trade.buyerReviewed = true;

        // 6. Эмит события (Critical for The Graph / Indexer)
        // Индексатор поймает это событие и пересчитает средний рейтинг продавца
        emit Events.ReviewSubmitted(
            _escrowId,
            msg.sender,   // Reviewer (Buyer)
            trade.seller, // Subject (Seller)
            _rating,
            _commentCid
        );
    }

    /**
     * @notice (Опционально) Ответ продавца на отзыв.
     * @dev Можно реализовать, чтобы продавец мог оставить публичный ответ.
     */
    /* 
    function replyToReview(...) external { ... } 
    */

    // =============================================================
    //                     ADMIN FUNCTIONS
    // =============================================================

    /**
     * @notice Установка адреса маркетплейса.
     * @dev Критически важно вызвать это после деплоя Marketplace.
     */
    function setMarketplace(address _marketplace) external onlyRole(ADMIN_ROLE) {
        if (_marketplace == address(0)) revert Errors.InvalidAddress();
        _grantRole(MARKETPLACE_ROLE, _marketplace);
    }

    /**
     * @notice Изменение времени на подачу отзыва.
     */
    function setReviewWindow(uint256 _seconds) external onlyRole(ADMIN_ROLE) {
        reviewWindow = _seconds;
    }
}