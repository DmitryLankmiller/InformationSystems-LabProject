package ru.ifmo.se.repository.search;

import java.util.ArrayList;
import java.util.List;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import ru.ifmo.se.model.City;

@ApplicationScoped
public class CitySearchRepository {

    @PersistenceContext
    private EntityManager em;

    public SearchPage<City> search(
        String namePattern,
        String governorNamePattern,
        List<SortRule> sorting,
        int page,
        int size) {
        if (page < 1 || size < 1 || size > 100_000) {
            throw new IllegalArgumentException("Bade page request");
        }

        String from = " FROM City c LEFT JOIN c.governor h";

        List<String> filters = new ArrayList<>();

        boolean filterByName = namePattern != null && !namePattern.isBlank();
        boolean filterByGovernorName = governorNamePattern != null && !governorNamePattern.isBlank();

        if (filterByName) {
            filters.add(" c.name LIKE :namePattern ESCAPE '!'");
        }
        if (filterByGovernorName) {
            filters.add(" h.name LIKE :governorNamePattern ESCAPE '!'");
        }

        if (!filters.isEmpty()) {
            from += " WHERE" + String.join(" AND", filters);
        }

        List<String> orders = new ArrayList<>();

        for (SortRule rule : sorting) {
            String expression = switch (rule.field()) {
                case NAME -> "c.name";
                case GOVERNOR_NAME -> "h.name";
            };

            orders.add(expression + (rule.ascending() ? " ASC" : " DESC"));
        }

        orders.add("c.id ASC");

        TypedQuery<City> query = em.createQuery(
            "SELECT c" + from + " ORDER BY " + String.join(", ", orders),
            City.class);

        TypedQuery<Long> countQuery = em.createQuery(
            "SELECT COUNT(c)" + from,
            Long.class);

        if (filterByName) {
            query.setParameter("namePattern", namePattern);
            countQuery.setParameter("namePattern", namePattern);
        }
        if (filterByGovernorName) {
            query.setParameter("governorNamePattern", governorNamePattern);
            countQuery.setParameter("governorNamePattern", governorNamePattern);
        }

        List<City> content = query
            .setFirstResult((page - 1) * size)
            .setMaxResults(size)
            .getResultList();

        long totalElements = countQuery.getSingleResult();

        long totalPages = totalElements / size + (totalElements % size == 0 ? 0 : 1);
        boolean hasNext = page < totalPages;

        return new SearchPage<City>(content, totalElements, page, size, hasNext, totalPages);

    }

}