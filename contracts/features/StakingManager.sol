// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Импорты
import "../libraries/DataTypes.sol";
import "../libraries/Errors.sol";
import "../libraries/Events.sol";
import "../interfaces/IDeMarketToken.sol";

/**
 * @title StakingManager
 * @author DeMarket Protocol Team
 * @notice Управляет стейкингом токенов DMT, блокировкой средств в спорах и статусом Арбитров.
 * @dev Интегрирован с Governance: сила голоса равна сумме стейка.
 */
contract StakingManager is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // =============================================================
    //                           ROLES
    // =============================================================
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    /// @dev Роль для контрактов, которые могут блокировать/сжигать средства (Marketplace, Arbitration)
    bytes32 public constant PROTOCOL_ROLE = keccak256("PROTOCOL_ROLE");

    // =============================================================
    //                           STATE
    // =============================================================

    IDeMarketToken public immutable dmtToken;

    /// @notice Информация о стейке пользователя
    struct StakeInfo {
        uint256 amount;       // Общая сумма стейка
        uint256 lockedAmount; // Часть суммы, которая заблокирована (в спорах)
        uint256 since;        // Время последнего изменения (для расчета "возраста" стейка)
    }

    /// @notice Маппинг адреса пользователя к его стейку
    mapping(address => StakeInfo) public stakes;

    /// @notice Минимальный стейк для получения статуса Арбитра (5000 DMT)
    uint256 public arbitratorThreshold;

    /// @notice Общее количество застейканных токенов в протоколе
    uint256 public totalStaked;

    // =============================================================
    //                        CONSTRUCTOR
    // =============================================================

    /**
     * @param _dmtToken Адрес токена платформы ($DMT)
     */
    constructor(address _dmtToken) {
        if (_dmtToken == address(0)) revert Errors.InvalidAddress();
        
        dmtToken = IDeMarketToken(_dmtToken);
        arbitratorThreshold = 5000 ether; // 5000 DMT (с учетом 18 decimals)

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // =============================================================
    //                     USER ACTIONS
    // =============================================================

    /**
     * @notice Внести токены в стейк.
     * @param _amount Количество токенов для стейкинга.
     */
    function stake(uint256 _amount) external nonReentrant whenNotPaused {
        if (_amount == 0) revert Errors.InvalidAmount();

        StakeInfo storage info = stakes[msg.sender];

        // Перевод токенов от пользователя к контракту
        IERC20(address(dmtToken)).safeTransferFrom(msg.sender, address(this), _amount);

        info.amount += _amount;
        info.since = block.timestamp;
        totalStaked += _amount;

        emit Events.Staked(msg.sender, _amount, info.amount);
    }

    /**
     * @notice Вывести токены из стейка.
     * @param _amount Количество токенов для вывода.
     * @dev Нельзя вывести заблокированные (locked) токены.
     */
    function unstake(uint256 _amount) external nonReentrant {
        StakeInfo storage info = stakes[msg.sender];
        
        if (_amount == 0) revert Errors.InvalidAmount();
        
        // Проверка: Стейк - Заблокировано >= Запрашиваемая сумма
        uint256 available = info.amount - info.lockedAmount;
        if (_amount > available) revert Errors.FundsLocked();

        info.amount -= _amount;
        totalStaked -= _amount;

        // Возврат токенов пользователю
        IERC20(address(dmtToken)).safeTransfer(msg.sender, _amount);

        emit Events.Unstaked(msg.sender, _amount, info.amount);
    }

    // =============================================================
    //                     PROTOCOL ACTIONS
    // =============================================================

    /**
     * @notice Блокировка части стейка (например, при открытии спора или подаче жалобы).
     * @dev Вызывается только доверенными контрактами (Marketplace/Arbitration).
     */
    function lockStake(address _user, uint256 _amount) external onlyRole(PROTOCOL_ROLE) {
        StakeInfo storage info = stakes[_user];
        
        // Проверяем, есть ли у пользователя достаточно свободных средств для блокировки
        uint256 available = info.amount - info.lockedAmount;
        if (_amount > available) revert Errors.InsufficientStake();

        info.lockedAmount += _amount;
        
        // Мы не эмитим отдельное событие Lock здесь, так как это usually часть larger flow,
        // но для дебага можно добавить.
    }

    /**
     * @notice Разблокировка стейка (после завершения спора).
     */
    function unlockStake(address _user, uint256 _amount) external onlyRole(PROTOCOL_ROLE) {
        StakeInfo storage info = stakes[_user];
        
        if (info.lockedAmount < _amount) revert Errors.InvalidAmount(); // Защита от underflow
        
        info.lockedAmount -= _amount;
    }

    /**
     * @notice Штраф (Slashing). Сжигание стейка за злонамеренные действия.
     * @param _user Адрес нарушителя
     * @param _amount Сумма штрафа
     * @dev Сначала разблокирует (если было заблокировано), потом сжигает.
     */
    function slash(address _user, uint256 _amount) external onlyRole(PROTOCOL_ROLE) {
        StakeInfo storage info = stakes[_user];

        if (info.amount < _amount) {
            // Если штраф больше всего стейка, забираем всё
            _amount = info.amount;
        }

        // Уменьшаем общий стейк
        info.amount -= _amount;
        
        // Если средства были заблокированы (например, в споре), уменьшаем и lock
        // Приоритет слэшинга идет из locked средств
        if (info.lockedAmount > 0) {
            if (info.lockedAmount >= _amount) {
                info.lockedAmount -= _amount;
            } else {
                info.lockedAmount = 0;
            }
        }
        
        totalStaked -= _amount;

        // Физическое сжигание токенов (отправка на 0x0...dead или burn function)
        // Так как токены на контракте, мы можем вызвать burn у токена (если он поддерживает)
        // Или просто отправить на dead address
        dmtToken.burn(_amount); 

        emit Events.Slashed(_user, _amount);
    }

    // =============================================================
    //                     VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Проверка, является ли пользователь Арбитром.
     */
    function isArbitrator(address _user) external view returns (bool) {
        return stakes[_user].amount >= arbitratorThreshold;
    }

    /**
     * @notice Получить "Силу голоса" пользователя (для DAO).
     * @dev Сейчас 1 токен = 1 голос. В будущем можно добавить множитель за время (Time-weighted).
     */
    function getVotingPower(address _user) external view returns (uint256) {
        return stakes[_user].amount;
    }

    /**
     * @notice Получить доступный для вывода баланс.
     */
    function getAvailableStake(address _user) external view returns (uint256) {
        return stakes[_user].amount - stakes[_user].lockedAmount;
    }

    // =============================================================
    //                     ADMIN
    // =============================================================

    /**
     * @notice Установка нового порога для Арбитров.
     */
    function setArbitratorThreshold(uint256 _newThreshold) external onlyRole(ADMIN_ROLE) {
        arbitratorThreshold = _newThreshold;
    }

    /**
     * @notice Выдача прав системным контрактам (Marketplace, ArbitrationRegistry).
     */
    function setProtocolRole(address _contract, bool _hasRole) external onlyRole(ADMIN_ROLE) {
        if (_hasRole) {
            _grantRole(PROTOCOL_ROLE, _contract);
        } else {
            _revokeRole(PROTOCOL_ROLE, _contract);
        }
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}