// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Импорт интерфейсов и библиотек
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";
import "../interfaces/IStakingManager.sol";
import "../interfaces/IDeMarketMarketplace.sol";

/**
 * @title ArbitrationRegistry
 * @author DeMarket Protocol Team
 * @notice Контракт для разрешения споров. Управляет набором присяжных и голосованием.
 * @dev Взаимодействует с Marketplace для исполнения решений и StakingManager для проверки прав судей.
 */
contract ArbitrationRegistry is AccessControl, ReentrancyGuard {
    
    // =============================================================
    //                           ROLES
    // =============================================================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");

    // =============================================================
    //                           STATE
    // =============================================================

    /// @notice Адрес контракта стейкинга (для проверки прав судей)
    IStakingManager public stakingManager;
    
    /// @notice Адрес маркетплейса (для исполнения решений)
    address public marketplace;

    /// @notice Размер жюри (нечетное число, чтобы избежать ничьей)
    uint256 public jurySize; 
    
    /// @notice Время, отведенное на набор судей и голосование (например, 3 дня)
    uint256 public disputeDuration;

    /// @notice Счетчик уникальных ID споров
    uint256 public nextDisputeId;

    /// @notice Хранилище споров: DisputeId => DisputeData
    mapping(uint256 => DataTypes.Dispute) public disputes;

    /// @notice Голоса по спору: DisputeId => Arbitrator Address => Vote Choice
    /// 0 = None, 1 = Buyer, 2 = Seller
    mapping(uint256 => mapping(address => uint8)) public votes;

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    /**
     * @param _stakingManager Адрес контракта StakingManager
     * @dev Marketplace устанавливается отдельно через setMarketplace, так как у них циклическая зависимость.
     */
    constructor(address _stakingManager) {
        if (_stakingManager == address(0)) revert Errors.InvalidAddress();
        
        stakingManager = IStakingManager(_stakingManager);
        
        jurySize = 3; // 3 судьи по умолчанию
        disputeDuration = 3 days;
        nextDisputeId = 1;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // =============================================================
    //                     CORE LOGIC (Marketplace)
    // =============================================================

    /**
     * @notice Создание нового спора. ВЫЗЫВАЕТСЯ ТОЛЬКО МАРКЕТПЛЕЙСОМ.
     * @return disputeId ID созданного спора
     */
    function createDispute(
        uint256 _escrowId,
        address _initiator,
        address _buyer,
        address _seller,
        uint256 _amount,
        string calldata _reasonCid
    ) external onlyRole(MARKETPLACE_ROLE) returns (uint256) {
        uint256 disputeId = nextDisputeId++;

        // Инициализируем массив присяжных пустым списком
        address[] memory emptyJurors;

        disputes[disputeId] = DataTypes.Dispute({
            id: disputeId,
            escrowId: _escrowId,
            initiator: _initiator,
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            reasonCid: _reasonCid,
            status: DataTypes.DisputeStatus.Recruiting, // Начинаем с набора судей
            createdAt: block.timestamp,
            deadline: block.timestamp + disputeDuration,
            jurors: emptyJurors,
            votesForBuyer: 0,
            votesForSeller: 0,
            winner: address(0)
        });

        emit Events.DisputeCreated(disputeId, _escrowId, _initiator);
        return disputeId;
    }

    // =============================================================
    //                     ARBITRATOR LOGIC
    // =============================================================

    /**
     * @notice Регистрация в качестве присяжного (Juror) на конкретный спор.
     * @dev Принцип "Кто первый встал, того и тапки". Требует стейка > 5000 DMT.
     */
    function joinAsJuror(uint256 _disputeId) external nonReentrant {
        DataTypes.Dispute storage dispute = disputes[_disputeId];

        // Проверки
        if (dispute.status != DataTypes.DisputeStatus.Recruiting) revert Errors.InvalidDisputeStatus();
        if (block.timestamp > dispute.deadline) revert Errors.DisputeExpired();
        
        // Нельзя быть судьей в своем деле
        if (msg.sender == dispute.buyer || msg.sender == dispute.seller) revert Errors.NotAuthorized();

        // Проверка квалификации через внешний контракт
        if (!stakingManager.isArbitrator(msg.sender)) revert Errors.NotQualifiedArbitrator();

        // Проверка на дубликаты (уже записался?)
        for (uint i = 0; i < dispute.jurors.length; i++) {
            if (dispute.jurors[i] == msg.sender) revert Errors.AlreadyJuror();
        }

        // Добавляем в жюри
        dispute.jurors.push(msg.sender);
        emit Events.JurorJoined(_disputeId, msg.sender);

        // Если набрали кворум, переходим к голосованию
        if (dispute.jurors.length >= jurySize) {
            dispute.status = DataTypes.DisputeStatus.Voting;
            // Продлеваем дедлайн для голосования
            dispute.deadline = block.timestamp + disputeDuration; 
            emit Events.DisputeStatusChanged(_disputeId, DataTypes.DisputeStatus.Voting);
        }
    }

    /**
     * @notice Голосование присяжного.
     * @param _disputeId ID спора
     * @param _voteForBuyer true = за Покупателя, false = за Продавца
     */
    function castVote(uint256 _disputeId, bool _voteForBuyer) external nonReentrant {
        DataTypes.Dispute storage dispute = disputes[_disputeId];

        if (dispute.status != DataTypes.DisputeStatus.Voting) revert Errors.InvalidDisputeStatus();
        if (block.timestamp > dispute.deadline) revert Errors.DisputeExpired();

        // Проверяем, является ли отправитель присяжным
        bool isJuror = false;
        for (uint i = 0; i < dispute.jurors.length; i++) {
            if (dispute.jurors[i] == msg.sender) {
                isJuror = true;
                break;
            }
        }
        if (!isJuror) revert Errors.NotArbitrator();

        // Проверяем, голосовал ли уже
        if (votes[_disputeId][msg.sender] != 0) revert Errors.AlreadyVoted();

        // Записываем голос (1 = Buyer, 2 = Seller)
        if (_voteForBuyer) {
            votes[_disputeId][msg.sender] = 1;
            dispute.votesForBuyer++;
        } else {
            votes[_disputeId][msg.sender] = 2;
            dispute.votesForSeller++;
        }

        emit Events.VoteCast(_disputeId, msg.sender, _voteForBuyer);

        // Если все проголосовали, можно сразу подводить итоги (опционально)
        if (dispute.votesForBuyer + dispute.votesForSeller == dispute.jurors.length) {
            _finalizeDispute(_disputeId);
        }
    }

    /**
     * @notice Завершение спора и исполнение решения.
     * @dev Может быть вызвано кем угодно, если время вышло или все проголосовали.
     */
    function finalizeDispute(uint256 _disputeId) external nonReentrant {
        _finalizeDispute(_disputeId);
    }

    // =============================================================
    //                     INTERNAL LOGIC
    // =============================================================

    function _finalizeDispute(uint256 _disputeId) internal {
        DataTypes.Dispute storage dispute = disputes[_disputeId];

        if (dispute.status != DataTypes.DisputeStatus.Voting) revert Errors.InvalidDisputeStatus();
        
        // Разрешаем финализацию, если все проголосовали ИЛИ вышло время
        bool timeExpired = block.timestamp > dispute.deadline;
        bool allVoted = (dispute.votesForBuyer + dispute.votesForSeller) == dispute.jurors.length;

        if (!timeExpired && !allVoted) revert Errors.VotingNotFinished();

        dispute.status = DataTypes.DisputeStatus.Resolved;
        
        address winner;
        
        // Логика определения победителя
        if (dispute.votesForBuyer > dispute.votesForSeller) {
            winner = dispute.buyer;
        } else if (dispute.votesForSeller > dispute.votesForBuyer) {
            winner = dispute.seller;
        } else {
            // НИЧЬЯ: По умолчанию в пользу покупателя (защита прав потребителей)
            // Или можно разделить средства 50/50 (потребует изменений в Marketplace)
            // Для MVP решаем в пользу покупателя
            winner = dispute.buyer; 
        }

        dispute.winner = winner;

        // Вызываем Marketplace для перевода средств
        // ВАЖНО: Мы кастим адрес в интерфейс IDeMarketMarketplace
        IDeMarketMarketplace(marketplace).resolveDispute(dispute.escrowId, winner);

        emit Events.DisputeResolved(_disputeId, winner);
    }

    // =============================================================
    //                     ADMIN
    // =============================================================

    /**
     * @notice Установка адреса Маркетплейса (вызывается после деплоя)
     */
    function setMarketplace(address _marketplace) external onlyRole(ADMIN_ROLE) {
        if (_marketplace == address(0)) revert Errors.InvalidAddress();
        marketplace = _marketplace;
        _grantRole(MARKETPLACE_ROLE, _marketplace);
    }

    function setJurySize(uint256 _size) external onlyRole(ADMIN_ROLE) {
        if (_size == 0 || _size % 2 == 0) revert Errors.InvalidJurySize(); // Должно быть нечетным
        jurySize = _size;
    }

    function setDisputeDuration(uint256 _seconds) external onlyRole(ADMIN_ROLE) {
        disputeDuration = _seconds;
    }
}