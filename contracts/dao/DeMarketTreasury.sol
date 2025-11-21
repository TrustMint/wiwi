// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title DeMarketTreasury
 * @author DeMarket Protocol Team
 * @notice Казна протокола и администратор прав.
 * @dev Реализует TimelockController. Является владельцем (Admin/Owner) для DeMarketMarketplace и других контрактов.
 * 
 * Логика работы:
 * 1. DeMarketDAO создает предложение.
 * 2. Если голосование успешно, предложение ставится в очередь (Queue) в этот контракт.
 * 3. Проходит время задержки (minDelay).
 * 4. Предложение исполняется (Execute).
 */
contract DeMarketTreasury is TimelockController {
    
    /**
     * @notice Конструктор Казны
     * @param minDelay Минимальная задержка перед исполнением (в секундах). 
     *                 Для продакшена рекомендуется минимум 24-48 часов (172800 секунд).
     * @param proposers Список адресов, которые могут предлагать транзакции. 
     *                  Сюда должен входить ТОЛЬКО адрес контракта DeMarketDAO.
     * @param executors Список адресов, которые могут нажать кнопку "Исполнить" после задержки.
     *                  Обычно передается `address(0)` (означает "кто угодно").
     * @param admin Адрес администратора, который может менять роли. 
     *              ВАЖНО: Обычно это сам TimelockController (this).
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}

    /**
     * @notice Позволяет контракту принимать нативный ETH/Gas Token (Arbitrum ETH).
     * @dev Необходимо для накопления комиссий в нативной валюте.
     * ВАЖНО: Добавлен 'override', так как TimelockController также имеет receive().
     */
    receive() external payable override {}

    /**
     * @notice Fallback функция на случай получения данных.
     */
    fallback() external payable {}
}