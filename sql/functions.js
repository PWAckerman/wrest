'use strict';


module.exports = {
    INSERT: `CREATE OR REPLACE FUNCTION notify_trigger() RETURNS trigger AS $$
                        DECLARE
                        BEGIN
                          PERFORM pg_notify('watchers', TG_TABLE_NAME || ',id,' || NEW.id || ',INSERT' );
                          RETURN new;
                        END;
                        $$ LANGUAGE plpgsql;`,
    UPDATE: `CREATE OR REPLACE FUNCTION notify_trigger_update() RETURNS trigger AS $$
                        DECLARE
                        BEGIN
                          PERFORM pg_notify('watchers', TG_TABLE_NAME || ',id,' || NEW.id || ',UPDATE' );
                          RETURN new;
                        END;
                        $$ LANGUAGE plpgsql;`,
    DELETE: `CREATE OR REPLACE FUNCTION notify_trigger_delete() RETURNS trigger as $$
                    DECLARE
                    BEGIN
                      PERFORM pg_notify('watchers', TG_TABLE_NAME || ',id,' || OLD.id || ',DELETE');
                      RETURN old;
                    END;
                    $$ LANGUAGE plpgsql;`

}
