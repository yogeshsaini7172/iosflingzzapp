-- Add the atomic QCS update function (fixed version)
CREATE OR REPLACE FUNCTION atomic_qcs_update(
  p_user_id text,
  p_total_score integer,
  p_logic_score integer,
  p_ai_score integer DEFAULT NULL,
  p_ai_meta jsonb DEFAULT NULL,
  p_per_category jsonb DEFAULT NULL,
  p_total_score_float numeric DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  qcs_result qcs%ROWTYPE;
  profile_rows_affected integer := 0;
BEGIN
  -- Upsert QCS record
  INSERT INTO qcs (
    user_id, total_score, total_score_float, logic_score, ai_score, ai_meta, per_category, updated_at
  )
  VALUES (
    p_user_id, p_total_score, COALESCE(p_total_score_float, p_total_score), 
    p_logic_score, p_ai_score, p_ai_meta, p_per_category, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    total_score_float = EXCLUDED.total_score_float,
    logic_score = EXCLUDED.logic_score,
    ai_score = EXCLUDED.ai_score,
    ai_meta = EXCLUDED.ai_meta,
    per_category = EXCLUDED.per_category,
    updated_at = now()
  RETURNING * INTO qcs_result;

  -- Update profiles.total_qcs atomically
  UPDATE profiles 
  SET total_qcs = p_total_score, qcs_synced_at = now(), updated_at = now()
  WHERE firebase_uid = p_user_id OR user_id = p_user_id;
  
  GET DIAGNOSTICS profile_rows_affected = ROW_COUNT;

  RETURN jsonb_build_object(
    'qcs_updated', true,
    'profile_updated', profile_rows_affected > 0,
    'profiles_affected', profile_rows_affected,
    'total_score', qcs_result.total_score,
    'logic_score', qcs_result.logic_score,
    'ai_score', qcs_result.ai_score
  );
END;
$$;