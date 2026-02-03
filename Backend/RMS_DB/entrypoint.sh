#!/bin/bash

# Configuration
DB_HOST="mssql"
DB_USER="sa"
DB_PASS="Password123!"
SQLCMD="/opt/mssql-tools18/bin/sqlcmd"

echo "Waiting for SQL Server to be ready..."

# Retry loop to check connection
for i in {1..50};
do
    $SQLCMD -S $DB_HOST -U $DB_USER -P $DB_PASS -C -Q "SELECT 1" > /dev/null 2>&1
    if [ $? -eq 0 ]
    then
        echo "SQL Server is ready."
        break
    else
        echo "Not ready yet..."
        sleep 2
    fi
done

echo "Running initialization scripts..."
for f in /init-scripts/*.sql; do
    echo "Executing $f ..."
    $SQLCMD -S $DB_HOST -U $DB_USER -P $DB_PASS -C -i "$f"
done

echo "Done initialization!"
