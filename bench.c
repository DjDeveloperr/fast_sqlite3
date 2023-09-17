#include "sqlite3.h"
#include <stdio.h>
#include <time.h>

int main() {
  sqlite3 *db;
  sqlite3_open(":memory:", &db);

  sqlite3_stmt *query;
  sqlite3_prepare_v2(db, "SELECT 100 as value", -1, &query, NULL);

  clock_t start = clock();
  for (int i = 0; i < 1000000; i++) {
    sqlite3_step(query);
    sqlite3_reset(query);
  }
  clock_t end = clock();

  printf("Time: %f\n", (double)(end - start) / CLOCKS_PER_SEC);

  return 0;
}
