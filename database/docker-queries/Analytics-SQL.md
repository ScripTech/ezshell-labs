# Analytics Queries

## Top Performers Analysis

```sh
docker exec -it ezshell-postgres-db psql -U ezshell_user -d ezshell_labs -t -c "
DO \$\$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(user_stats), '[]'::json) INTO result FROM (
        SELECT json_build_object(
            'user_name', u.name,
            'user_email', u.email,
            'performance_metrics', json_build_object(
                'total_attempts', COUNT(ta.id),
                'unique_tasks', COUNT(DISTINCT ta.\"taskId\"),
                'unique_sessions', COUNT(DISTINCT ta.\"sessionId\"),
                'average_score', ROUND(AVG(ta.score::numeric), 2),
                'highest_score', MAX(ta.score::numeric),
                'total_time_spent_hours', ROUND(SUM(ta.\"timeSpent\") / 3600.0, 2),
                'avg_time_per_task_minutes', ROUND(AVG(ta.\"timeSpent\") / 60.0, 2),
                'completion_rate', ROUND(
                    (COUNT(CASE WHEN ta.status = 'completed' THEN 1 END)::float / COUNT(ta.id)::float * 100), 2
                ),
                'hints_usage', json_build_object(
                    'total_hints_used', SUM(ta.\"hintsUsed\"),
                    'avg_hints_per_attempt', ROUND(AVG(ta.\"hintsUsed\"), 2)
                )
            ),
            'latest_activity', MAX(ta.\"createdAt\"),
            'learning_efficiency', ROUND(
                (AVG(ta.score::numeric) / NULLIF(AVG(ta.\"hintsUsed\"), 0)), 2
            )
        ) as user_stats
        FROM users u
        JOIN task_attempts ta ON u.id = ta.\"userId\"
        WHERE ta.score IS NOT NULL
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(ta.id) > 0
        ORDER BY AVG(ta.score::numeric) DESC, COUNT(ta.id) DESC
        LIMIT 10
    ) top_users;

    RAISE NOTICE '%', result::text;
END
\$\$;
" | grep 'NOTICE:' | sed 's/NOTICE:  //' | jq -r '.[] | "\(.user_name): \(.performance_metrics.average_score) avg score, \(.performance_metrics.total_attempts) attempts, \(.performance_metrics.completion_rate)% completion, \(.performance_metrics.total_time_spent_hours)h total"'
```

## Active Learning Sessions Dashboard

```sh
docker exec -it ezshell-postgres-db psql -U ezshell_user -d ezshell_labs -t -c "
DO \$\$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(session_data), '[]'::json) INTO result FROM (
        SELECT json_build_object(
            'user_name', u.name,
            'session_info', json_build_object(
                'session_name', lps.\"sessionName\",
                'lab_name', l.name,
                'status', lps.status,
                'overall_progress', lps.\"overallProgress\",
                'time_spent_minutes', ROUND(lps.\"totalTimeSpent\" / 60.0, 2),
                'time_remaining_minutes', ROUND(lps.\"timeRemaining\" / 60.0, 2),
                'started_at', lps.\"startedAt\",
                'last_active', lps.\"lastActiveAt\",
                'expires_at', lps.\"expiresAt\"
            ),
            'current_task', json_build_object(
                'task_name', COALESCE(ct.name, 'No current task'),
                'task_id', lps.\"currentTaskId\"
            ),
            'session_progress', json_build_object(
                'total_attempts', COUNT(ta.id),
                'completed_tasks', COUNT(CASE WHEN ta.status = 'completed' THEN 1 END),
                'failed_tasks', COUNT(CASE WHEN ta.status = 'failed' THEN 1 END),
                'in_progress_tasks', COUNT(CASE WHEN ta.status = 'in_progress' THEN 1 END),
                'average_score', ROUND(AVG(ta.score::numeric), 2)
            )
        ) as session_data
        FROM lab_progress_sessions lps
        JOIN users u ON lps.\"userId\" = u.id
        LEFT JOIN labs l ON lps.\"labId\" = l.id
        LEFT JOIN lab_tasks ct ON lps.\"currentTaskId\" = ct.id
        LEFT JOIN task_attempts ta ON lps.id = ta.\"sessionId\"
        WHERE lps.status IN ('active', 'paused')
        AND lps.\"lastActiveAt\" > NOW() - INTERVAL '24 hours'
        GROUP BY u.id, u.name, lps.id, lps.\"sessionName\", l.name, lps.status,
                 lps.\"overallProgress\", lps.\"totalTimeSpent\", lps.\"timeRemaining\",
                 lps.\"startedAt\", lps.\"lastActiveAt\", lps.\"expiresAt\",
                 ct.name, lps.\"currentTaskId\"
        ORDER BY lps.\"lastActiveAt\" DESC
        LIMIT 15
    ) active_sessions;

    RAISE NOTICE '%', result::text;
END
\$\$;
" | grep 'NOTICE:' | sed 's/NOTICE:  //' | jq -r '.[] | "\(.user_name) - \(.session_info.lab_name): \(.session_info.overall_progress)% complete, \(.session_progress.total_attempts) attempts, \(.session_info.status) - Current: \(.current_task.task_name)"'
```

## Task Difficulty and Performance Analysis

```sh
docker exec -it ezshell-postgres-db psql -U ezshell_user -d ezshell_labs -t -c "
DO \$\$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(task_analytics), '[]'::json) INTO result FROM (
        SELECT json_build_object(
            'task_info', json_build_object(
                'task_id', ta.\"taskId\",
                'task_name', COALESCE(lt.name, 'Task ' || ta.\"taskId\"),
                'lab_name', COALESCE(l.name, 'Unknown Lab')
            ),
            'difficulty_metrics', json_build_object(
                'total_attempts', COUNT(ta.id),
                'unique_users', COUNT(DISTINCT ta.\"userId\"),
                'avg_attempts_per_user', ROUND(AVG(ta.\"attemptNumber\"), 2),
                'completion_rate', ROUND(
                    (COUNT(CASE WHEN ta.status = 'completed' THEN 1 END)::float / COUNT(ta.id)::float * 100), 2
                ),
                'failure_rate', ROUND(
                    (COUNT(CASE WHEN ta.status = 'failed' THEN 1 END)::float / COUNT(ta.id)::float * 100), 2
                )
            ),
            'score_analysis', json_build_object(
                'average_score', ROUND(AVG(ta.score::numeric), 2),
                'median_score', PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ta.score::numeric),
                'min_score', MIN(ta.score::numeric),
                'max_score', MAX(ta.score::numeric),
                'score_stddev', ROUND(STDDEV(ta.score::numeric), 2)
            ),
            'time_analysis', json_build_object(
                'avg_time_minutes', ROUND(AVG(ta.\"timeSpent\") / 60.0, 2),
                'median_time_minutes', ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ta.\"timeSpent\") / 60.0, 2),
                'fastest_completion_minutes', ROUND(MIN(CASE WHEN ta.status = 'completed' THEN ta.\"timeSpent\" END) / 60.0, 2),
                'slowest_completion_minutes', ROUND(MAX(CASE WHEN ta.status = 'completed' THEN ta.\"timeSpent\" END) / 60.0, 2)
            ),
            'help_usage', json_build_object(
                'total_hints_used', SUM(ta.\"hintsUsed\"),
                'avg_hints_per_attempt', ROUND(AVG(ta.\"hintsUsed\"), 2),
                'users_needing_hints_pct', ROUND(
                    (COUNT(CASE WHEN ta.\"hintsUsed\" > 0 THEN 1 END)::float / COUNT(ta.id)::float * 100), 2
                ),
                'max_hints_used', MAX(ta.\"hintsUsed\")
            ),
            'validation_insights', json_build_object(
                'total_validation_steps', COUNT(vs.id),
                'avg_steps_per_attempt', ROUND(AVG(steps_per_attempt.step_count), 2),
                'most_common_errors', (
                    SELECT json_agg(error_data) FROM (
                        SELECT
                            unnest(array_agg(DISTINCT ta2.errors::text)) as error,
                            COUNT(*) as frequency
                        FROM task_attempts ta2
                        WHERE ta2.\"taskId\" = ta.\"taskId\"
                        AND ta2.errors IS NOT NULL
                        AND ta2.errors::text != '[]'
                        GROUP BY unnest(array_agg(DISTINCT ta2.errors::text))
                        ORDER BY COUNT(*) DESC
                        LIMIT 3
                    ) error_data
                )
            )
        ) as task_analytics
        FROM task_attempts ta
        LEFT JOIN lab_tasks lt ON ta.\"taskId\" = lt.id
        LEFT JOIN labs l ON lt.\"labId\" = l.id
        LEFT JOIN validation_steps vs ON ta.id = vs.\"attemptId\"
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as step_count
            FROM validation_steps vs2
            WHERE vs2.\"attemptId\" = ta.id
        ) steps_per_attempt ON true
        WHERE ta.score IS NOT NULL
        GROUP BY ta.\"taskId\", lt.name, l.name
        HAVING COUNT(ta.id) >= 5  -- Only tasks with at least 5 attempts
        ORDER BY COUNT(ta.id) DESC, AVG(ta.score::numeric) ASC
        LIMIT 20
    ) task_difficulty;

    RAISE NOTICE '%', result::text;
END
\$\$;
" | grep 'NOTICE:' | sed 's/NOTICE:  //' | jq -r '.[] | "\(.task_info.task_name) (\(.task_info.lab_name)): \(.difficulty_metrics.completion_rate)% completion, \(.score_analysis.average_score) avg score, \(.time_analysis.avg_time_minutes)min avg, \(.help_usage.avg_hints_per_attempt) hints avg"'
```

## Learning Analytics and Patterns

```sh
docker exec -it ezshell-postgres-db psql -U ezshell_user -d ezshell_labs -t -c "
DO \$\$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(learning_data), '[]'::json) INTO result FROM (
        SELECT json_build_object(
            'user_name', u.name,
            'learning_analytics', COALESCE(la_data.analytics, '{}'::json),
            'computed_metrics', json_build_object(
                'total_learning_sessions', COUNT(DISTINCT lps.id),
                'active_days', COUNT(DISTINCT DATE(ta.\"createdAt\")),
                'learning_streak', (
                    SELECT COUNT(*) FROM (
                        SELECT DATE(ta2.\"createdAt\") as learning_date
                        FROM task_attempts ta2
                        WHERE ta2.\"userId\" = u.id
                        AND ta2.\"createdAt\" >= CURRENT_DATE - INTERVAL '30 days'
                        GROUP BY DATE(ta2.\"createdAt\")
                        ORDER BY learning_date DESC
                    ) daily_activity
                ),
                'improvement_trend', json_build_object(
                    'recent_avg_score', (
                        SELECT ROUND(AVG(ta3.score::numeric), 2)
                        FROM task_attempts ta3
                        WHERE ta3.\"userId\" = u.id
                        AND ta3.\"createdAt\" >= NOW() - INTERVAL '7 days'
                    ),
                    'previous_avg_score', (
                        SELECT ROUND(AVG(ta4.score::numeric), 2)
                        FROM task_attempts ta4
                        WHERE ta4.\"userId\" = u.id
                        AND ta4.\"createdAt\" >= NOW() - INTERVAL '14 days'
                        AND ta4.\"createdAt\" < NOW() - INTERVAL '7 days'
                    )
                ),
                'learning_velocity', json_build_object(
                    'tasks_per_session', ROUND(
                        COUNT(ta.id)::float / NULLIF(COUNT(DISTINCT lps.id), 0), 2
                    ),
                    'avg_session_duration_minutes', ROUND(
                        AVG(lps.\"totalTimeSpent\") / 60.0, 2
                    ),
                    'completion_velocity', ROUND(
                        COUNT(CASE WHEN ta.status = 'completed' THEN 1 END)::float /
                        NULLIF(EXTRACT(EPOCH FROM (MAX(ta.\"createdAt\") - MIN(ta.\"createdAt\"))) / 86400, 0), 2
                    )
                )
            ),
            'behavioral_patterns', json_build_object(
                'preferred_learning_hours', (
                    SELECT json_object_agg(hour_of_day, attempt_count) FROM (
                        SELECT
                            EXTRACT(HOUR FROM ta5.\"createdAt\") as hour_of_day,
                            COUNT(*) as attempt_count
                        FROM task_attempts ta5
                        WHERE ta5.\"userId\" = u.id
                        GROUP BY EXTRACT(HOUR FROM ta5.\"createdAt\")
                        ORDER BY attempt_count DESC
                        LIMIT 5
                    ) hourly_pattern
                ),
                'session_patterns', json_build_object(
                    'avg_tasks_before_break', ROUND(AVG(session_task_count.task_count), 2),
                    'most_productive_day', (
                        SELECT TO_CHAR(DATE(ta6.\"createdAt\"), 'Day')
                        FROM task_attempts ta6
                        WHERE ta6.\"userId\" = u.id
                        GROUP BY DATE(ta6.\"createdAt\"), TO_CHAR(DATE(ta6.\"createdAt\"), 'Day')
                        ORDER BY AVG(ta6.score::numeric) DESC
                        LIMIT 1
                    )
                )
            )
        ) as learning_data
        FROM users u
        LEFT JOIN task_attempts ta ON u.id = ta.\"userId\"
        LEFT JOIN lab_progress_sessions lps ON u.id = lps.\"userId\"
        LEFT JOIN LATERAL (
            SELECT
                json_build_object(
                    'total_time_spent_hours', ROUND(la.\"totalTimeSpent\" / 3600.0, 2),
                    'completion_rate', la.\"completionRate\",
                    'average_score', la.\"averageScore\",
                    'struggling_topics', la.\"strugglingTopics\",
                    'strong_areas', la.\"strongAreas\",
                    'last_analyzed', la.\"lastAnalyzedAt\"
                ) as analytics
            FROM learning_analytics la
            WHERE la.\"userId\" = u.id
            ORDER BY la.\"lastAnalyzedAt\" DESC
            LIMIT 1
        ) la_data ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as task_count
            FROM task_attempts ta_inner
            WHERE ta_inner.\"sessionId\" = lps.id
        ) session_task_count ON true
        WHERE ta.\"userId\" IS NOT NULL
        GROUP BY u.id, u.name, la_data.analytics
        HAVING COUNT(ta.id) > 0
        ORDER BY COUNT(ta.id) DESC
        LIMIT 15
    ) user_learning_analytics;

    RAISE NOTICE '%', result::text;
END
\$\$;
" | grep 'NOTICE:' | sed 's/NOTICE:  //' | jq '.'
```

## Real-time Events and System Activity

```sh
docker exec -it ezshell-postgres-db psql -U ezshell_user -d ezshell_labs -t -c "
DO \$\$
DECLARE
    result json;
BEGIN
    SELECT COALESCE(json_agg(event_data), '[]'::json) INTO result FROM (
        SELECT json_build_object(
            'event_summary', json_build_object(
                'event_type', re.\"eventType\",
                'total_events', COUNT(re.id),
                'unique_users', COUNT(DISTINCT re.\"userId\"),
                'unique_sessions', COUNT(DISTINCT re.\"sessionId\"),
                'latest_event', MAX(re.timestamp),
                'event_frequency_per_hour', ROUND(
                    COUNT(re.id)::float /
                    NULLIF(EXTRACT(EPOCH FROM (MAX(re.timestamp) - MIN(re.timestamp))) / 3600, 0), 2
                )
            ),
            'user_activity', json_build_object(
                'most_active_user', (
                    SELECT u.name
                    FROM users u
                    JOIN realtime_events re2 ON u.id = re2.\"userId\"
                    WHERE re2.\"eventType\" = re.\"eventType\"
                    AND re2.timestamp >= NOW() - INTERVAL '24 hours'
                    GROUP BY u.id, u.name
                    ORDER BY COUNT(re2.id) DESC
                    LIMIT 1
                ),
                'recent_events', (
                    SELECT json_agg(
                        json_build_object(
                            'user_name', u.name,
                            'timestamp', re3.timestamp,
                            'event_data', re3.\"eventData\",
                            'source_ip', re3.\"sourceIP\"
                        ) ORDER BY re3.timestamp DESC
                    ) FROM (
                        SELECT re3.*, u.name
                        FROM realtime_events re3
                        JOIN users u ON re3.\"userId\" = u.id
                        WHERE re3.\"eventType\" = re.\"eventType\"
                        AND re3.timestamp >= NOW() - INTERVAL '1 hour'
                        ORDER BY re3.timestamp DESC
                        LIMIT 5
                    ) re3
                )
            )
        ) as event_data
        FROM realtime_events re
        WHERE re.timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY re.\"eventType\"
        ORDER BY COUNT(re.id) DESC
        LIMIT 10
    ) event_analytics;

    RAISE NOTICE '%', result::text;
END
\$\$;
" | grep 'NOTICE:' | sed 's/NOTICE:  //' | jq -r '.[] | "\(.event_summary.event_type): \(.event_summary.total_events) events by \(.event_summary.unique_users) users, \(.event_summary.event_frequency_per_hour) events/hour"'
```

## Platform Overview and Health Check

```sh
docker exec -it ezshell-postgres-db psql -U ezshell_user -d ezshell_labs -t -c "
DO \$\$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'platform_stats', json_build_object(
            'total_users', (SELECT COUNT(*) FROM users),
            'active_users_24h', (SELECT COUNT(DISTINCT \"userId\") FROM task_attempts WHERE \"createdAt\" > NOW() - INTERVAL '24 hours'),
            'total_labs', (SELECT COUNT(*) FROM labs),
            'total_tasks', (SELECT COUNT(*) FROM lab_tasks),
            'active_sessions', (SELECT COUNT(*) FROM lab_progress_sessions WHERE status = 'active'),
            'total_enrollments', (SELECT COUNT(*) FROM lab_enrollments)
        ),
        'activity_metrics', json_build_object(
            'task_attempts_24h', (SELECT COUNT(*) FROM task_attempts WHERE \"createdAt\" > NOW() - INTERVAL '24 hours'),
            'completed_tasks_24h', (SELECT COUNT(*) FROM task_attempts WHERE status = 'completed' AND \"createdAt\" > NOW() - INTERVAL '24 hours'),
            'new_sessions_today', (SELECT COUNT(*) FROM lab_progress_sessions WHERE \"startedAt\" >= CURRENT_DATE),
            'realtime_events_1h', (SELECT COUNT(*) FROM realtime_events WHERE timestamp > NOW() - INTERVAL '1 hour')
        ),
        'performance_overview', json_build_object(
            'platform_avg_score', (SELECT ROUND(AVG(score::numeric), 2) FROM task_attempts WHERE score IS NOT NULL),
            'overall_completion_rate', (
                SELECT ROUND(
                    (COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*)::float * 100), 2
                ) FROM task_attempts
            ),
            'avg_session_duration_minutes', (SELECT ROUND(AVG(\"totalTimeSpent\") / 60.0, 2) FROM lab_progress_sessions WHERE \"totalTimeSpent\" > 0),
            'total_learning_hours', (SELECT ROUND(SUM(\"timeSpent\") / 3600.0, 2) FROM task_attempts WHERE \"timeSpent\" > 0)
        ),
        'system_health', json_build_object(
            'sessions_near_expiry', (SELECT COUNT(*) FROM lab_progress_sessions WHERE \"expiresAt\" < NOW() + INTERVAL '1 hour' AND status = 'active'),
            'long_running_sessions', (SELECT COUNT(*) FROM lab_progress_sessions WHERE \"totalTimeSpent\" > 14400 AND status = 'active'), -- 4+ hours
            'failed_attempts_1h', (SELECT COUNT(*) FROM task_attempts WHERE status = 'failed' AND \"createdAt\" > NOW() - INTERVAL '1 hour'),
            'validation_errors_1h', (SELECT COUNT(*) FROM validation_steps WHERE status = 'failed' AND \"createdAt\" > NOW() - INTERVAL '1 hour')
        ),
        'top_performers_today', (
            SELECT json_agg(performer_data) FROM (
                SELECT json_build_object(
                    'user_name', u.name,
                    'completed_tasks', COUNT(CASE WHEN ta.status = 'completed' THEN 1 END),
                    'avg_score', ROUND(AVG(ta.score::numeric), 2)
                ) as performer_data
                FROM users u
                JOIN task_attempts ta ON u.id = ta.\"userId\"
                WHERE ta.\"createdAt\" >= CURRENT_DATE
                GROUP BY u.id, u.name
                HAVING COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) > 0
                ORDER BY COUNT(CASE WHEN ta.status = 'completed' THEN 1 END) DESC, AVG(ta.score::numeric) DESC
                LIMIT 5
            ) top_today
        )
    ) INTO result;

    RAISE NOTICE '%', result::text;
END
\$\$;
" | grep 'NOTICE:' | sed 's/NOTICE:  //' | jq '.'
```
