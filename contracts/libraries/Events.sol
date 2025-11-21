// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DataTypes.sol";

/**
 * @title Events
 * @author DeMarket Protocol Team
 * @notice Централизованная библиотека событий для всей экосистемы DeMarket.
 * @dev Используется для упрощения индексации данных (The Graph) и отслеживания активности.
 */
library Events {

    // =============================================================
    //                        MARKETPLACE: LISTINGS
    // =============================================================

    /**
     * @notice Создано новое объявление.
     */
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 price,
        address token,
        string ipfsCid
    );

    /**
     * @notice Параметры объявления обновлены (цена или количество).
     */
    event ListingUpdated(
        uint256 indexed listingId,
        uint256 newPrice,
        uint256 newQuantity
    );

    /**
     * @notice Объявление снято с продажи (отменено).
     */
    event ListingCancelled(uint256 indexed listingId);

    /**
     * @notice Активировано платное продвижение (Boost).
     * @dev Индексатор должен использовать это для сортировки товаров в UI.
     */
    event BoostActivated(
        uint256 indexed listingId,
        uint256 amountBurned,
        uint256 durationSeconds
    );

    // =============================================================
    //                        MARKETPLACE: ESCROW
    // =============================================================

    /**
     * @notice Покупатель внес средства, сделка началась.
     */
    event PurchaseInitiated(
        uint256 indexed escrowId,
        uint256 indexed listingId,
        address indexed buyer,
        address seller,
        uint256 amount
    );

    /**
     * @notice Сделка успешно завершена, средства переведены продавцу.
     */
    event PurchaseCompleted(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    // =============================================================
    //                        DISPUTES (High Level)
    // =============================================================

    /**
     * @notice Открыт спор по сделке. Средства заморожены.
     */
    event DisputeOpened(
        uint256 indexed escrowId,
        address indexed initiator,
        uint256 disputeId
    );

    /**
     * @notice Спор разрешен, средства распределены.
     */
    event DisputeResolved(
        uint256 indexed escrowId,
        address indexed winner
    );

    // =============================================================
    //                        STAKING & GOVERNANCE
    // =============================================================

    /**
     * @notice Пользователь внес токены в стейк.
     */
    event Staked(
        address indexed user,
        uint256 amount,
        uint256 newTotalStake
    );

    /**
     * @notice Пользователь вывел токены из стейка.
     */
    event Unstaked(
        address indexed user,
        uint256 amount,
        uint256 newTotalStake
    );

    /**
     * @notice Стейк пользователя был сожжен (штраф за нарушение).
     */
    event Slashed(
        address indexed user,
        uint256 amount
    );

    // =============================================================
    //                        ARBITRATION (Registry)
    // =============================================================

    /**
     * @notice В реестре арбитража создан новый кейс.
     */
    event DisputeCreated(
        uint256 indexed disputeId,
        uint256 indexed escrowId,
        address indexed initiator
    );

    /**
     * @notice Арбитр присоединился к рассмотрению спора.
     */
    event JurorJoined(
        uint256 indexed disputeId,
        address indexed juror
    );

    /**
     * @notice Статус спора изменился (например, с Recruiting на Voting).
     */
    event DisputeStatusChanged(
        uint256 indexed disputeId,
        DataTypes.DisputeStatus status
    );

    /**
     * @notice Арбитр проголосовал.
     */
    event VoteCast(
        uint256 indexed disputeId,
        address indexed juror,
        bool voteForBuyer
    );

    // =============================================================
    //                        REPUTATION
    // =============================================================

    /**
     * @notice Сделка завершена, открыто окно для отзыва.
     */
    event ReviewWindowOpened(
        uint256 indexed escrowId,
        address indexed buyer,
        address indexed seller
    );

    /**
     * @notice Отзыв успешно оставлен и записан в блокчейн.
     */
    event ReviewSubmitted(
        uint256 indexed escrowId,
        address indexed reviewer,
        address indexed subject, // Кого оценивали (продавец)
        uint8 rating,
        string commentCid
    );

    // =============================================================
    //                        ADMIN & CONFIG
    // =============================================================

    /**
     * @notice Изменена комиссия платформы.
     */
    event PlatformFeeChanged(uint256 newFeeBps);

    /**
     * @notice Изменен статус токена (разрешен/запрещен к оплате).
     */
    event TokenStatusChanged(address indexed token, bool allowed);
}