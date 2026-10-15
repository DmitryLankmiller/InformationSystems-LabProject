package ru.ifmo.se.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class City {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private long id; // Значение поля должно быть больше 0, Значение этого поля должно быть
                     // уникальным, Значение этого поля должно генерироваться автоматически

    private String name; // Поле не может быть null, Строка не может быть пустой

    @OneToOne
    @JoinColumn(name = "coordinates_id")
    private Coordinates coordinates; // Поле не может быть null

    @Column(name = "creation_date", insertable = false, updatable = false)
    @Setter(AccessLevel.NONE)
    private java.time.LocalDateTime creationDate; // Поле не может быть null, Значение этого поля должно генерироваться
                                                  // автоматически

    private float area; // Значение поля должно быть больше 0

    private int population; // Значение поля должно быть больше 0

    @Column(name = "establishment_date")
    @Convert(converter = ZonedDateTimeConverter.class)
    private java.time.ZonedDateTime establishmentDate;

    private Boolean capital; // Поле не может быть null

    @Column(name = "meters_above_sea_level")
    private Double metersAboveSeaLevel;

    @Column(name = "telephone_code")
    private Long telephoneCode; // Значение поля должно быть больше 0, Максимальное значение поля: 100000

    @Enumerated(EnumType.STRING)
    private Climate climate; // Поле может быть null

    @Column(name = "standard_of_living")
    @Enumerated(EnumType.STRING)
    private StandardOfLiving standardOfLiving; // Поле может быть null

    @ManyToOne(optional = false)
    @JoinColumn(name = "governor_id")
    private Human governor; // Поле не может быть null
}
