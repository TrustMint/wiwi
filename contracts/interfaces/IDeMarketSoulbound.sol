// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title IDeMarketSoulbound
 * @author DeMarket Protocol Team
 * @notice Интерфейс системы репутации (Soulbound Tokens).
 * @dev Расширяет стандарт IERC1155 функциями минтинга и сжигания (revoke).
 */
interface IDeMarketSoulbound is IERC1155 {

    /**
     * @notice Выдать бадж пользователю.
     * @dev Может быть вызвано только адресом с ролью MINTER_ROLE (Маркетплейс, Стейкинг).
     * 
     * @param _to Адрес получателя баджа.
     * @param _id ID баджа (см. константы на фронтенде/в документации).
     * @param _amount Количество (обычно 1).
     * @param _data Дополнительные данные (bytes).
     */
    function mint(
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) external;

    /**
     * @notice Выдать несколько баджей сразу.
     * @dev Экономит газ при выдаче набора достижений (Batch Minting).
     * 
     * @param _to Адрес получателя.
     * @param _ids Массив ID баджей.
     * @param _amounts Массив количеств.
     * @param _data Дополнительные данные.
     */
    function mintBatch(
        address _to,
        uint256[] memory _ids,
        uint256[] memory _amounts,
        bytes memory _data
    ) external;

    /**
     * @notice Отозвать бадж (наказание/слэшинг).
     * @dev Вызывается при нарушении правил протокола (только ADMIN или MINTER).
     * 
     * @param _from Адрес, у которого отзывается бадж.
     * @param _id ID баджа.
     * @param _amount Количество для сжигания.
     */
    function revokeBadge(
        address _from,
        uint256 _id,
        uint256 _amount
    ) external;
}