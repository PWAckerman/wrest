'use strict';

class Triggers{
    constructor(name){
        console.log(name);
        console.log('NEW TRIGGERS');
        this.modelName = name;
        this.INSERT = `CREATE TRIGGER watched_table_trigger AFTER INSERT ON "${name}" FOR EACH ROW EXECUTE PROCEDURE notify_trigger();`;
        this.UPDATE = `CREATE TRIGGER watched_table_trigger_update AFTER UPDATE ON "${name}" FOR EACH ROW EXECUTE PROCEDURE notify_trigger_update();`;
        this.DELETE = `CREATE TRIGGER watched_table_trigger_delete AFTER DELETE ON "${name}" FOR EACH ROW EXECUTE PROCEDURE notify_trigger_delete();`;
        console.log(this);
    }
}

module.exports = Triggers
