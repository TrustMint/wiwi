// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/**
 * @title IDeMarketToken
 * @author DeMarket Protocol Team
 * @notice Интерфейс токена управления DeMarket (DMT).
 * @dev Объединяет ERC20, Permit и специфичную логику сжигания/минтинга.
 */
interface IDeMarketToken is IERC20, IERC20Permit {
    
    /**
     * @notice Сжигание токенов с кошелька вызывающего.
     * @dev Используется StakingManager для реализации штрафов (Slashing).
     * @param amount Количество токенов для сжигания (в wei).
     */
    function burn(uint256 amount) external;

    /**
     * @notice Сжигание токенов с указанного кошелька.
     * @dev Требует предварительного `approve`. Используется Маркетплейсом для оплаты услуг (Boost).
     * 
     * @param account Адрес, с которого сжигаются токены.
     * @param amount Количество токенов.
     */
    function burnFrom(address account, uint256 amount) external;

    /**
     * @notice Выпуск новых токенов.
     * @dev Доступно только контрактам с ролью MINTER_ROLE (например, будущим контрактам наград/фарминга).
     * 
     * @param to Адрес получателя.
     * @param amount Количество токенов.
     */
    function mint(address to, uint256 amount) external;
}