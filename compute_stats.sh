#!/bin/bash

cat log.txt | \
  grep -iE '[a-z]+\.[a-z]+@[a-z]+\.[a-z]+'| \
  grep -v 'joshua\.warner'| \
  grep -E 'confirm|booked'| \
  grep -oE '[a-z]+\.[a-z]+@[a-z]+\.[a-z]+'| \
  sort|uniq -c > user_stats.txt

cat log.txt | \
  grep -iE '[a-z]+\.[a-z]+@readytalk\.com' | \
  grep -v 'joshua\.warner' | \
  grep -E 'confirm|booked' | \
  grep -oE '^[a-zA-Z]+ [0-9]+' | \
  uniq -c > day_stats.txt

cat log.txt | \
  grep -iE '[a-z]+\.[a-z]+@readytalk\.com' | \
  grep -v 'joshua\.warner' | \
  grep -E 'confirm|booked' | \
  grep -oE 'lawrence|arapahoe|curtis|champa|stout|california|welton|nerdlounge|dartroom|larimer|market|wynkoop|wazee|blake|wewatta|execboard|enclave1|enclave2|delgany|nerd\s*lounge|executive(\s*board(\s*room)?)?|dart(\s*room)?|enclave\s*(1|one)|enclave\s*(2|two)' | \
  sort| uniq -c > room_stats.txt
