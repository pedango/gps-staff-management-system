-- Convert Member.department from PostgreSQL enum to TEXT without dropping data.
ALTER TABLE "Member" ALTER COLUMN "department" TYPE TEXT USING (
  CASE "department"::text
    WHEN 'FPU' THEN 'FPU — Formed Police Unit'
    WHEN 'MTTD' THEN 'MTTD — Motor Traffic & Transport Department'
    WHEN 'PID' THEN 'PID — Police Intelligence Department'
    WHEN 'CID' THEN 'CID — Criminal Investigation Department'
    WHEN 'CRIMINAL_INVESTIGATIONS' THEN 'CID — Criminal Investigation Department'
    WHEN 'DOMESTIC_VIOLENCE' THEN 'DOVVSU — Domestic Violence and Victim Support Unit'
    WHEN 'NARCOTICS' THEN 'Narcotics — Narcotics Control'
    WHEN 'MARINE_POLICE' THEN 'Marine Police'
    WHEN 'AIRPORT_POLICE' THEN 'Airport Police'
    WHEN 'VIP_PROTECTION' THEN 'VIP Protection'
    WHEN 'GENERAL_DUTIES' THEN 'General Duties'
    WHEN 'ADMINISTRATION' THEN 'Administration'
    ELSE "department"::text
  END
);

DROP TYPE IF EXISTS "Department";
