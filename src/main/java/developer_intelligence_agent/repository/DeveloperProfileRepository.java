package developer_intelligence_agent.repository;

import developer_intelligence_agent.model.DeveloperProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeveloperProfileRepository extends JpaRepository<DeveloperProfile, String> {

    // Classic inverted index keyword search match
    @Query("SELECT d FROM DeveloperProfile d WHERE " +
            "LOWER(d.skillsContent) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.developerName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(d.profileId) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<DeveloperProfile> searchByKeyword(@Param("keyword") String keyword);
}