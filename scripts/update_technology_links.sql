-- Script to update the Link field in the Technology table
-- Sets Link to: https://yellow-ground-0b93aea03.1.azurestaticapps.net/technologies/ + GeneratedID

-- Method 1: Direct UPDATE statement (recommended)
UPDATE [dbo].[Technology]
SET [Link] = 'https://yellow-ground-0b93aea03.1.azurestaticapps.net/technologies/' + CAST([GeneratedID] AS VARCHAR(50))
WHERE [GeneratedID] IS NOT NULL;

-- Method 2: Generate individual UPDATE statements for each row (if you prefer to see each statement)
/*
SELECT 
    'UPDATE [dbo].[Technology] SET [Link] = ''https://yellow-ground-0b93aea03.1.azurestaticapps.net/technologies/' + 
    CAST([GeneratedID] AS VARCHAR(50)) + 
    ''' WHERE [ID] = ' + CAST([ID] AS VARCHAR(10)) + ';' AS UpdateStatement
FROM [dbo].[Technology]
WHERE [GeneratedID] IS NOT NULL
ORDER BY [ID];
*/

-- Method 3: Backup and update with verification
/*
-- First, create a backup of the current Link values
SELECT [ID], [GeneratedID], [Link] AS OldLink,
       'https://yellow-ground-0b93aea03.1.azurestaticapps.net/technologies/' + CAST([GeneratedID] AS VARCHAR(50)) AS NewLink
INTO TechnologyLinkBackup
FROM [dbo].[Technology]
WHERE [GeneratedID] IS NOT NULL;

-- Then update the Link field
UPDATE [dbo].[Technology]
SET [Link] = 'https://yellow-ground-0b93aea03.1.azurestaticapps.net/technologies/' + CAST([GeneratedID] AS VARCHAR(50))
WHERE [GeneratedID] IS NOT NULL;

-- Verify the update
SELECT TOP 10 [ID], [GeneratedID], [Link]
FROM [dbo].[Technology]
WHERE [GeneratedID] IS NOT NULL;
*/