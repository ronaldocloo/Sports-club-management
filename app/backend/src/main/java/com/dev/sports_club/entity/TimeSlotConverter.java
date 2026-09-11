package com.dev.sports_club.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TimeSlotConverter implements AttributeConverter<TimeSlot, String> {

    @Override
    public String convertToDatabaseColumn(TimeSlot attribute) {
        if (attribute == null) {
            return null;
        }
        return switch (attribute) {
            case SLOT_06_08 -> "06:00-08:00";
            case SLOT_08_10 -> "08:00-10:00";
            case SLOT_10_12 -> "10:00-12:00";
            case SLOT_12_14 -> "12:00-14:00";
            case SLOT_14_16 -> "14:00-16:00";
            case SLOT_16_18 -> "16:00-18:00";
            case SLOT_18_20 -> "18:00-20:00";
            case SLOT_20_22 -> "20:00-22:00";
        };
    }

    @Override
    public TimeSlot convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return switch (dbData) {
            case "06:00-08:00" -> TimeSlot.SLOT_06_08;
            case "08:00-10:00" -> TimeSlot.SLOT_08_10;
            case "10:00-12:00" -> TimeSlot.SLOT_10_12;
            case "12:00-14:00" -> TimeSlot.SLOT_12_14;
            case "14:00-16:00" -> TimeSlot.SLOT_14_16;
            case "16:00-18:00" -> TimeSlot.SLOT_16_18;
            case "18:00-20:00" -> TimeSlot.SLOT_18_20;
            case "20:00-22:00" -> TimeSlot.SLOT_20_22;
            default -> throw new IllegalArgumentException("Unknown time slot: " + dbData);
        };
    }
}
