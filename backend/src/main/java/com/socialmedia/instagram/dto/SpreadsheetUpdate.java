package com.socialmedia.instagram.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Message payload broadcast on {@code /topic/spreadsheet/updates} whenever profile
 * or post metrics are refreshed. The frontend matches updates to grid rows by
 * {@code profileUrl} or {@code postUrl}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpreadsheetUpdate {

    public static final String TYPE_PROFILE_UPDATE = "PROFILE_UPDATE";
    public static final String TYPE_POST_METRICS_UPDATE = "POST_METRICS_UPDATE";

    /** "PROFILE_UPDATE" or "POST_METRICS_UPDATE". */
    private String type;

    /** Set for PROFILE_UPDATE messages. */
    private String profileUrl;

    /** Set for POST_METRICS_UPDATE messages. */
    private String postUrl;

    /** The updated field values (e.g. likesCount, reach, followersCount, ...). */
    private Map<String, Object> data;
}
