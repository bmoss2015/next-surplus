-- Fix 22: when a document's category is "other" the user must name it. Store
-- that free-text label here; the existing `filename` is the uploaded file's
-- name, which is a separate thing.

alter table documents add column custom_name text;
