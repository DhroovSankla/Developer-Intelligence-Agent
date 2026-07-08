package developer_intelligence_agent.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "developer_profiles")
@Data
public class DeveloperProfile {

    @Id
    private String profileId;

    private String developerName;

    @Column(columnDefinition = "TEXT")
    private String skillsContent;

    private String role;
    private String focus;

    public String getProfileId() { return profileId; }
    public String getDeveloperName() { return developerName; }
    public String getSkillsContent() { return skillsContent; }
    public String getRole() { return role; }
    public String getFocus() { return focus; }

}