-- Fix BBBBB PART 4: normalize existing relative names to Title Case so records
-- imported in lower- or upper-case display correctly. (Going forward the
-- importer proper-cases on insert and the UI renders names proper-cased.)
update relatives
   set full_name = initcap(full_name)
 where full_name is not null
   and full_name <> initcap(full_name);
