package ru.ifmo.se.utils;

import java.lang.reflect.Field;
import java.util.HashSet;
import java.util.Set;

import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PatchManager {
    public void applyPatch(Object src, Object target) {
        Class<?> srcClass = src.getClass();
        Class<?> targetClass = target.getClass();

        Set<String> annulatedFields = new HashSet<>();
        for (Field field : srcClass.getDeclaredFields()) {
            if (field.isAnnotationPresent(SkipPatch.class)) {
                continue;
            }
            field.setAccessible(true);
            try {
                Object value = field.get(src);
                if (value != null) {
                    String fieldName = field.getName();
                    if (fieldName.contains("annulate")) {
                        if ((Boolean) value) {
                            String targetFieldName = fieldName.replace("annulate", "");
                            targetFieldName = Character.toLowerCase(targetFieldName.charAt(0)) +
                                (targetFieldName.length() > 1 ? targetFieldName.substring(1) : "");
                            Field targetField = targetClass.getDeclaredField(targetFieldName);
                            targetField.setAccessible(true);
                            targetField.set(target, null);
                            annulatedFields.add(targetFieldName);
                        }
                    } else {
                        if (!annulatedFields.contains(fieldName)) {
                            Field targetField = targetClass.getDeclaredField(fieldName);
                            targetField.setAccessible(true);
                            targetField.set(target, value);
                        }
                    }
                }
            } catch (Exception e) {
                throw new IllegalArgumentException(e);
            }
        }
    }
}
