// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IStakingManager
 * @author DeMarket Protocol Team
 * @notice Интерфейс для управления стейкингом, блокировками средств и проверкой статуса.
 */
interface IStakingManager {

    // =============================================================
    //                     USER FUNCTIONS
    // =============================================================

    /**
     * @notice Внести токены в стейк.
     * @param _amount Количество токенов $DMT для стейкинга.
     */
    function stake(uint256 _amount) external;

    /**
     * @notice Вывести токены из стейка.
     * @param _amount Количество токенов для вывода.
     */
    function unstake(uint256 _amount) external;

    // =============================================================
    //                     PROTOCOL FUNCTIONS
    // =============================================================

    /**
     * @notice Блокировка части стейка (например, залог при открытии спора).
     * @dev Вызывается только доверенными контрактами (Marketplace, Arbitration).
     * 
     * @param _user Адрес пользователя.
     * @param _amount Сумма для блокировки.
     */
    function lockStake(address _user, uint256 _amount) external;

    /**
     * @notice Разблокировка стейка (после завершения спора или отмены жалобы).
     * @dev Вызывается только доверенными контрактами.
     * 
     * @param _user Адрес пользователя.
     * @param _amount Сумма для разблокировки.
     */
    function unlockStake(address _user, uint256 _amount) external;

    /**
     * @notice Штраф (Slashing). Сжигание стейка за злонамеренные действия.
     * @dev Вызывается только доверенными контрактами (например, при проигрыше в арбитраже).
     * 
     * @param _user Адрес нарушителя.
     * @param _amount Сумма штрафа.
     */
    function slash(address _user, uint256 _amount) external;

    // =============================================================
    //                     VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Проверка, является ли пользователь квалифицированным Арбитром.
     * @return true, если стейк пользователя выше минимального порога.
     */
    function isArbitrator(address _user) external view returns (bool);

    /**
     * @notice Получить силу голоса пользователя (для интеграции с DAO).
     */
    function getVotingPower(address _user) external view returns (uint256);

    /**
     * @notice Получить доступный для вывода (свободный) стейк.
     * @return amount Общий стейк минус заблокированные средства.
     */
    function getAvailableStake(address _user) external view returns (uint256);

    /**
     * @notice Получить полную информацию о стейке пользователя.
     * @return amount Общая сумма стейка.
     * @return lockedAmount Заблокированная сумма.
     * @return since Timestamp последнего изменения.
     */
    function stakes(address _user) external view returns (
        uint256 amount, 
        uint256 lockedAmount, 
        uint256 since
    );
}