// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IReputationReview
 * @author DeMarket Protocol Team
 * @notice Интерфейс системы децентрализованной репутации.
 * @dev Используется маркетплейсом для уведомления о завершенных сделках.
 */
interface IReputationReview {

    /**
     * @notice Уведомление о завершении сделки.
     * @dev Вызывается ТОЛЬКО контрактом Marketplace (Role: MARKETPLACE_ROLE) 
     * при успешном вызове confirmReceipt.
     * 
     * Эта функция создает запись о том, что покупатель имеет право оставить отзыв
     * по конкретному _escrowId в течение определенного времени.
     * 
     * @param _escrowId Уникальный ID сделки.
     * @param _buyer Адрес покупателя (кто будет оставлять отзыв).
     * @param _seller Адрес продавца (кого будут оценивать).
     */
    function notifyTradeCompleted(
        uint256 _escrowId,
        address _buyer,
        address _seller
    ) external;
    
    /**
     * @notice Оставить отзыв (для UI/Интеграций).
     * @dev Определено здесь для полноты интерфейса, хотя вызывается пользователями напрямую.
     */
    function leaveReview(
        uint256 _escrowId,
        uint8 _rating,
        string calldata _commentCid
    ) external;
}