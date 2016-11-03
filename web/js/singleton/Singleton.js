let instance = null

class Singleton {
    constructor() {
        if(!instance) {
            instance = this;
            this.time = new Date()
            this.globalData = {}
            this.neo4jData = {}
            this.d3Data = {}
            return instance
        }
    }
}

export default Singleton = new Singleton()