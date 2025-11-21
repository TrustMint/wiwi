// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

/**
 * @title IDeMarketMarketplace
 * @author DeMarket Protocol Team
 * @notice Интерфейс ядра маркетплейса.
 */
interface IDeMarketMarketplace {
    
    // =============================================================
    //                     CORE LOGIC
    // =============================================================

    /**
     * @notice Исполнение решения по спору.
     * @dev Вызывается ТОЛЬКО контрактом ArbitrationRegistry после голосования.
     * 
     * @param _escrowId ID сделки (Escrow), по которой велся спор.
     * @param _winner Адрес победителя (Покупатель или Продавец), которому уйдут средства.
     */
    function resolveDispute(uint256 _escrowId, address _winner) external;

    // =============================================================
    //                     VIEW FUNCTIONS
    // =============================================================

    /**
     * @notice Получить детали объявления.
     * @dev Сигнатура соответствует автоматическому геттеру для mapping(uint256 => Listing) public listings.
     */
    function listings(uint256 _listingId) external view returns (
        uint256 id,
        address seller,
        address token,
        uint256 price,
        uint256 quantity,
        string memory ipfsCid,
        DataTypes.ListingStatus status,
        uint256 createdAt
    );

    /**
     * @notice Получить детали сделки (Escrow).
     * @dev Сигнатура соответствует автоматическому геттеру для mapping(uint256 => Escrow) public escrows.
     */
    function escrows(uint256 _escrowId) external view returns (
        uint256 id,
        uint256 listingId,
        address buyer,
        address seller,
        uint256 amount,
        address token,
        DataTypes.EscrowStatus status,
        uint256 createdAt,
        uint256 disputeId
    );
}