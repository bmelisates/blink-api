-- Mevcut foreign key adları Hibernate tarafından otomatik üretilmiş olsa bile
-- ilişkileri tablo ve kolonlarına göre bulup kaldırır.
BEGIN;

DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class child_table ON child_table.oid = c.conrelid
        JOIN pg_namespace child_schema ON child_schema.oid = child_table.relnamespace
        JOIN pg_attribute child_column
            ON child_column.attrelid = child_table.oid
            AND child_column.attnum = ANY (c.conkey)
        WHERE c.contype = 'f'
          AND child_schema.nspname = 'public'
          AND child_table.relname = 'tweets'
          AND child_column.attname IN ('user_id', 'parent_tweet_id')
    LOOP
        EXECUTE format('ALTER TABLE public.tweets DROP CONSTRAINT %I', constraint_name);
    END LOOP;

    FOR constraint_name IN
        SELECT DISTINCT c.conname
        FROM pg_constraint c
        JOIN pg_class child_table ON child_table.oid = c.conrelid
        JOIN pg_namespace child_schema ON child_schema.oid = child_table.relnamespace
        JOIN pg_attribute child_column
            ON child_column.attrelid = child_table.oid
            AND child_column.attnum = ANY (c.conkey)
        WHERE c.contype = 'f'
          AND child_schema.nspname = 'public'
          AND child_table.relname = 'likes'
          AND child_column.attname IN ('user_id', 'tweet_id')
    LOOP
        EXECUTE format('ALTER TABLE public.likes DROP CONSTRAINT %I', constraint_name);
    END LOOP;

    FOR constraint_name IN
        SELECT DISTINCT c.conname
        FROM pg_constraint c
        JOIN pg_class child_table ON child_table.oid = c.conrelid
        JOIN pg_namespace child_schema ON child_schema.oid = child_table.relnamespace
        JOIN pg_attribute child_column
            ON child_column.attrelid = child_table.oid
            AND child_column.attnum = ANY (c.conkey)
        WHERE c.contype = 'f'
          AND child_schema.nspname = 'public'
          AND child_table.relname = 'retweets'
          AND child_column.attname IN ('user_id', 'tweet_id')
    LOOP
        EXECUTE format('ALTER TABLE public.retweets DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

-- Kullanıcı silinince ona ait tweetler silinir.
ALTER TABLE public.tweets
    ADD CONSTRAINT fk_tweets_user
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

-- Ana tweet silinirse başka kullanıcılara ait yanıtlar korunur,
-- yalnızca parent bağlantıları kaldırılır.
ALTER TABLE public.tweets
    ADD CONSTRAINT fk_tweets_parent_tweet
    FOREIGN KEY (parent_tweet_id)
    REFERENCES public.tweets (id)
    ON UPDATE NO ACTION
    ON DELETE SET NULL;

-- Tweet silinince o tweete gelen bütün beğeniler silinir.
ALTER TABLE public.likes
    ADD CONSTRAINT fk_likes_tweet
    FOREIGN KEY (tweet_id)
    REFERENCES public.tweets (id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

-- Kullanıcı silinince onun yaptığı bütün beğeniler silinir.
ALTER TABLE public.likes
    ADD CONSTRAINT fk_likes_user
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

-- Kullanıcı silinince onun yaptığı bütün retweetler silinir.
ALTER TABLE public.retweets
    ADD CONSTRAINT fk_retweets_user
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

-- Tweet silinince o tweet için yapılan bütün retweetler silinir.
ALTER TABLE public.retweets
    ADD CONSTRAINT fk_retweets_tweet
    FOREIGN KEY (tweet_id)
    REFERENCES public.tweets (id)
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

COMMIT;
