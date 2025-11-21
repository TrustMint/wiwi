// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// --- OpenZeppelin Security & Standards ---
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// --- Internal Interfaces & Libraries ---
// Убедись, что эти файлы существуют по указанным путям (как мы обсуждали в структуре)
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";
import "../interfaces/IArbitrationRegistry.sol";
import "../interfaces/IReputationReview.sol";
import "../interfaces/IDeMarketToken.sol";

/**
 * @title DeMarketMarketplace
 * @author DeMarket Protocol Team
 * @notice Ядро торговой платформы. Управляет листингами, Escrow-счетами и комиссиями.
 * @dev Взаимодействует с модулями Арбитража и Репутации.
 */
contract DeMarketMarketplace is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // =============================================================
    //                           ROLES
    // =============================================================
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    /// @dev Роль для DAO/Timelock контракта для изменения критических параметров (комиссий)
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    // =============================================================
    //                           STATE
    // =============================================================

    /// @notice Счетчик уникальных ID для объявлений
    uint256 public nextListingId;
    
    /// @notice Счетчик уникальных ID для сделок
    uint256 public nextEscrowId;

    /// @notice Адрес кошелька/контракта, куда уходят комиссии (DeMarketTreasury)
    address public treasury;

    /// @notice Комиссия платформы в базисных пунктах (100 = 1%, 10000 = 100%)
    uint256 public platformFeeBps; 
    
    /// @notice Максимально возможная комиссия (защита от злоупотребления Governance)
    uint256 public constant MAX_FEE_BPS = 1000; // 10%

    /// @notice Поддерживаемые токены для оплаты (USDC, USDT, DAI)
    /// @dev Token Address => Allowed Bool
    mapping(address => bool) public allowedTokens;

    /// @notice Хранилище объявлений
    mapping(uint256 => DataTypes.Listing) public listings;

    /// @notice Хранилище активных и завершенных сделок
    mapping(uint256 => DataTypes.Escrow) public escrows;

    // =============================================================
    //                     EXTERNAL MODULES
    // =============================================================
    
    IArbitrationRegistry public arbitrationRegistry;
    IReputationReview public reputationReview;
    IDeMarketToken public dmtToken; // Токен для оплаты услуг продвижения

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    /**
     * @param _treasury Адрес контракта казначейства (DeMarketTreasury)
     * @param _dmtToken Адрес токена управления ($DMT)
     * @param _arbitrationRegistry Адрес контракта судов (ArbitrationRegistry)
     * @param _reputationReview Адрес контракта отзывов (ReputationReview)
     * 
     * @dev ВНИМАНИЕ: Эти адреса передаются при деплое. Не нужно вписывать их сюда вручную.
     */
    constructor(
        address _treasury,
        address _dmtToken,
        address _arbitrationRegistry,
        address _reputationReview
    ) {
        if (_treasury == address(0)) revert Errors.InvalidAddress();
        if (_dmtToken == address(0)) revert Errors.InvalidAddress();
        
        treasury = _treasury;
        dmtToken = IDeMarketToken(_dmtToken);
        arbitrationRegistry = IArbitrationRegistry(_arbitrationRegistry);
        reputationReview = IReputationReview(_reputationReview);

        platformFeeBps = 100; // Ставим 1% по умолчанию
        nextListingId = 1;    // ID начинаются с 1, 0 зарезервирован
        nextEscrowId = 1;

        // Выдаем права администратора деплоеру (тебе). 
        // Позже ты передашь GOVERNANCE_ROLE контракту DAO.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender); 
    }

    // =============================================================
    //                     LISTING LOGIC
    // =============================================================

    /**
     * @notice Создать новое объявление о продаже
     * @param _token Адрес токена, который продавец хочет получить (USDC/USDT)
     * @param _price Цена за единицу товара (в wei токена)
     * @param _quantity Количество единиц товара
     * @param _ipfsCid Ссылка на JSON метаданные в IPFS (название, описание, фото)
     */
    function createListing(
        address _token,
        uint256 _price,
        uint256 _quantity,
        string calldata _ipfsCid
    ) external whenNotPaused nonReentrant {
        if (!allowedTokens[_token]) revert Errors.TokenNotAllowed();
        if (_price == 0) revert Errors.InvalidPrice();
        if (_quantity == 0) revert Errors.InvalidQuantity();

        uint256 listingId = nextListingId++;

        listings[listingId] = DataTypes.Listing({
            id: listingId,
            seller: msg.sender,
            token: _token,
            price: _price,
            quantity: _quantity,
            ipfsCid: _ipfsCid,
            status: DataTypes.ListingStatus.Active,
            createdAt: block.timestamp
        });

        emit Events.ListingCreated(listingId, msg.sender, _price, _token, _ipfsCid);
    }

    /**
     * @notice Обновить цену или количество. Только владелец.
     */
    function updateListing(uint256 _listingId, uint256 _newPrice, uint256 _newQuantity) external {
        DataTypes.Listing storage listing = listings[_listingId];
        
        if (listing.seller != msg.sender) revert Errors.NotSeller();
        if (listing.status != DataTypes.ListingStatus.Active) revert Errors.ListingNotActive();

        listing.price = _newPrice;
        listing.quantity = _newQuantity;
        
        if (_newQuantity == 0) {
            listing.status = DataTypes.ListingStatus.Inactive;
        }

        emit Events.ListingUpdated(_listingId, _newPrice, _newQuantity);
    }

    /**
     * @notice Снять объявление с продажи
     */
    function cancelListing(uint256 _listingId) external {
        DataTypes.Listing storage listing = listings[_listingId];
        
        // Отменить может продавец или Админ (модерация)
        if (listing.seller != msg.sender && !hasRole(ADMIN_ROLE, msg.sender)) {
            revert Errors.NotAuthorized();
        }
        if (listing.status != DataTypes.ListingStatus.Active) revert Errors.ListingNotActive();

        listing.status = DataTypes.ListingStatus.Inactive;
        
        emit Events.ListingCancelled(_listingId);
    }

    /**
     * @notice Платное продвижение объявления (Burn to Boost)
     * @dev Сжигает токены $DMT у пользователя. Индексатор ловит событие и поднимает товар в UI.
     */
    function boostListing(uint256 _listingId, uint256 _amountDmt, uint256 _durationSeconds) external nonReentrant {
        if (listings[_listingId].status != DataTypes.ListingStatus.Active) revert Errors.ListingNotActive();
        if (_amountDmt == 0) revert Errors.InvalidAmount();

        // Сжигаем токены с кошелька пользователя
        // Пользователь должен заранее сделать `approve` на адрес Marketplace
        dmtToken.burnFrom(msg.sender, _amountDmt);

        emit Events.BoostActivated(_listingId, _amountDmt, _durationSeconds);
    }

    // =============================================================
    //                     ESCROW LOGIC (BUYING)
    // =============================================================

    /**
     * @notice Покупка товара. Блокирует средства покупателя в контракте.
     * @param _listingId ID объявления
     * @param _quantity Количество покупаемого товара
     */
    function buy(uint256 _listingId, uint256 _quantity) external whenNotPaused nonReentrant {
        DataTypes.Listing storage listing = listings[_listingId];

        // Проверки
        if (listing.status != DataTypes.ListingStatus.Active) revert Errors.ListingNotActive();
        if (listing.quantity < _quantity) revert Errors.InsufficientStock();
        if (listing.seller == msg.sender) revert Errors.CannotBuyOwnListing();

        uint256 totalAmount = listing.price * _quantity;

        // Обновляем склад
        listing.quantity -= _quantity;
        if (listing.quantity == 0) {
            listing.status = DataTypes.ListingStatus.Sold;
        }

        // Создаем запись Escrow
        uint256 escrowId = nextEscrowId++;
        escrows[escrowId] = DataTypes.Escrow({
            id: escrowId,
            listingId: _listingId,
            buyer: msg.sender,
            seller: listing.seller,
            amount: totalAmount,
            token: listing.token,
            status: DataTypes.EscrowStatus.Funded,
            createdAt: block.timestamp,
            disputeId: 0
        });

        // Забираем токены у покупателя и держим на контракте
        IERC20(listing.token).safeTransferFrom(msg.sender, address(this), totalAmount);

        emit Events.PurchaseInitiated(escrowId, _listingId, msg.sender, listing.seller, totalAmount);
    }

    /**
     * @notice Подтверждение получения товара покупателем.
     * @dev Разблокирует средства продавцу, взимает комиссию платформы.
     */
    function confirmReceipt(uint256 _escrowId) external nonReentrant {
        DataTypes.Escrow storage escrow = escrows[_escrowId];

        if (escrow.buyer != msg.sender) revert Errors.NotBuyer();
        if (escrow.status != DataTypes.EscrowStatus.Funded) revert Errors.InvalidEscrowStatus();

        escrow.status = DataTypes.EscrowStatus.Completed;

        // Расчет комиссии
        uint256 fee = (escrow.amount * platformFeeBps) / 10000;
        uint256 sellerAmount = escrow.amount - fee;

        // Выплата комиссии в Treasury
        if (fee > 0) {
            IERC20(escrow.token).safeTransfer(treasury, fee);
        }
        // Выплата продавцу
        IERC20(escrow.token).safeTransfer(escrow.seller, sellerAmount);

        // Сообщаем контракту репутации, что сделка успешна
        // Это позволит покупателю оставить отзыв
        reputationReview.notifyTradeCompleted(_escrowId, escrow.buyer, escrow.seller);

        emit Events.PurchaseCompleted(_escrowId, escrow.buyer, escrow.seller, escrow.amount);
    }

    // =============================================================
    //                     DISPUTE LOGIC
    // =============================================================

    /**
     * @notice Открыть спор (Покупатель или Продавец)
     * @dev Замораживает сделку и передает дело в ArbitrationRegistry
     */
    function openDispute(uint256 _escrowId, string calldata _reasonCid) external nonReentrant {
        DataTypes.Escrow storage escrow = escrows[_escrowId];

        // Только участники сделки могут открыть спор
        if (msg.sender != escrow.buyer && msg.sender != escrow.seller) revert Errors.NotAuthorized();
        // Спор можно открыть только пока деньги в Escrow
        if (escrow.status != DataTypes.EscrowStatus.Funded) revert Errors.InvalidEscrowStatus();

        escrow.status = DataTypes.EscrowStatus.Disputed;

        // Вызов внешнего контракта арбитража
        uint256 disputeId = arbitrationRegistry.createDispute(
            _escrowId,
            msg.sender, // Инициатор
            escrow.buyer,
            escrow.seller,
            escrow.amount,
            _reasonCid
        );

        escrow.disputeId = disputeId;

        emit Events.DisputeOpened(_escrowId, msg.sender, disputeId);
    }

    /**
     * @notice Разрешение спора (ВЫЗЫВАЕТСЯ ТОЛЬКО КОНТРАКТОМ АРБИТРАЖА)
     * @dev Арбитры проголосовали, контракт Арбитража вызывает эту функцию, чтобы распределить средства.
     */
    function resolveDispute(uint256 _escrowId, address _winner) external nonReentrant {
        if (msg.sender != address(arbitrationRegistry)) revert Errors.NotArbitrator();

        DataTypes.Escrow storage escrow = escrows[_escrowId];
        if (escrow.status != DataTypes.EscrowStatus.Disputed) revert Errors.InvalidEscrowStatus();

        escrow.status = DataTypes.EscrowStatus.Resolved;

        if (_winner == escrow.buyer) {
            // 1. Победил Покупатель -> 100% возврат средств покупателю
            IERC20(escrow.token).safeTransfer(escrow.buyer, escrow.amount);
        } else {
            // 2. Победил Продавец -> Деньги продавцу (минус комиссия платформы)
            uint256 fee = (escrow.amount * platformFeeBps) / 10000;
            uint256 sellerAmount = escrow.amount - fee;

            if (fee > 0) {
                IERC20(escrow.token).safeTransfer(treasury, fee);
            }
            IERC20(escrow.token).safeTransfer(escrow.seller, sellerAmount);
        }

        emit Events.DisputeResolved(_escrowId, _winner);
    }

    // =============================================================
    //                     ADMIN / GOVERNANCE
    // =============================================================

    /**
     * @notice Включить/выключить прием определенного токена (USDC, USDT)
     */
    function setAllowedToken(address _token, bool _allowed) external onlyRole(ADMIN_ROLE) {
        allowedTokens[_token] = _allowed;
        emit Events.TokenStatusChanged(_token, _allowed);
    }

    /**
     * @notice Изменить комиссию платформы (только DAO)
     */
    function setPlatformFee(uint256 _bps) external onlyRole(GOVERNANCE_ROLE) {
        if (_bps > MAX_FEE_BPS) revert Errors.FeeTooHigh();
        platformFeeBps = _bps;
        emit Events.PlatformFeeChanged(_bps);
    }

    /**
     * @notice Обновить адрес Treasury (только DAO/Admin)
     */
    function setTreasury(address _newTreasury) external onlyRole(ADMIN_ROLE) {
        if (_newTreasury == address(0)) revert Errors.InvalidAddress();
        treasury = _newTreasury;
    }

    /**
     * @notice Обновление зависимостей (если обновили логику Арбитража или Репутации)
     */
    function setDependencies(
        address _arbitrationRegistry,
        address _reputationReview
    ) external onlyRole(ADMIN_ROLE) {
        arbitrationRegistry = IArbitrationRegistry(_arbitrationRegistry);
        reputationReview = IReputationReview(_reputationReview);
    }

    /// @notice Экстренная пауза всех операций
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /// @notice Возобновление операций
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}