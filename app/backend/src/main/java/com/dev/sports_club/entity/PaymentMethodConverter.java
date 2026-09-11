package com.dev.sports_club.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PaymentMethodConverter implements AttributeConverter<PaymentMethod, String> {

    @Override
    public String convertToDatabaseColumn(PaymentMethod attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case Cash -> "Cash";
            case Card -> "Card";
            case BankTransfer -> "Bank Transfer";
            case MobileMoney -> "Mobile Money";
        };
    }

    @Override
    public PaymentMethod convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "Cash" -> PaymentMethod.Cash;
            case "Card" -> PaymentMethod.Card;
            case "Bank Transfer" -> PaymentMethod.BankTransfer;
            case "Mobile Money" -> PaymentMethod.MobileMoney;
            default -> throw new IllegalArgumentException("Unknown payment method: " + dbData);
        };
    }
}
