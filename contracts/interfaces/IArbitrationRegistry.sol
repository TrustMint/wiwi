// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../libraries/DataTypes.sol";

/**
 * @title IArbitrationRegistry
 * @author DeMarket Protocol Team
 * @notice Интерфейс для взаимодействия с системой арбитража.
 */
interface IArbitrationRegistry {
    
    /**
     * @notice Создание нового спора.
     * @dev Вызывается только авторизованным контрактом Маркетплейса при вызове openDispute.
     * 
     * @param _escrowId ID сделки в маркетплейсе.
     * @param _initiator Адрес того, кто открыл спор (покупатель или продавец).
     * @param _buyer Адрес покупателя.
     * @param _seller Адрес продавца.
     * @param _amount Сумма сделки (замороженные средства).
     * @param _reasonCid IPFS хэш с причиной спора и доказательствами.
     * 
     * @return disputeId Уникальный ID созданного спора.
     */
    function createDispute(
        uint256 _escrowId,
        address _initiator,
        address _buyer,
        address _seller,
        uint256 _amount,
        string calldata _reasonCid
    ) external returns (uint256);

    /**
     * @notice Получить информацию о присяжном (опционально для UI).
     * @param _disputeId ID спора.
     * @param _juror Адрес пользователя.
     * @return hasVoted Голосовал ли уже этот пользователь.
     */
    function votes(uint256 _disputeId, address _juror) external view returns (uint8);
}