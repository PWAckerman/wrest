'use strict';

class Triggers{
    constructor(name){
        console.log(name);
        console.log('NEW TRIGGERS');
        this.modelName = name;
        this.INSERT = `BEGIN;
                       DROP TRIGGER IF EXISTS watched_table_trigger ON "${name}";
                       CREATE TRIGGER watched_table_trigger AFTER INSERT ON "${name}" FOR EACH ROW EXECUTE PROCEDURE notify_trigger();
                       COMMIT;`;
        this.UPDATE = `BEGIN;
                        DROP TRIGGER IF EXISTS watched_table_trigger_update ON "${name}";
                        CREATE TRIGGER watched_table_trigger_update AFTER UPDATE ON "${name}" FOR EACH ROW EXECUTE PROCEDURE notify_trigger_update();
                       COMMIT;`;
        this.DELETE = `BEGIN;
                        DROP TRIGGER IF EXISTS watched_table_trigger_delete ON "${name}";
                        CREATE TRIGGER watched_table_trigger_delete AFTER DELETE ON "${name}" FOR EACH ROW EXECUTE PROCEDURE notify_trigger_delete();
                       COMMIT;`;
        console.log(this);
    }
}

module.exports = Triggers
