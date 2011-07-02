function buffetRestaurantSimulation(
        BuffetCapacity, 
        PreparationTime, 
        MeanArrival, 
        CashierTime, 
        Seed, 
        Simtime) 
{
    var sim = new Sim(); 
    var stats = new Sim.Population();
    var cashier = new Sim.Facility('Cashier');
    var buffet = new Sim.Buffer('Buffet', BuffetCapacity);
    var random = new Random(Seed);
    
    var Customer = {
        start: function () {
            this.order();
            
            var nextCustomerAt = random.exponential (1.0 / MeanArrival); 
            this.setTimer(nextCustomerAt).done(this.start);
        },
        
        order: function () {
            sim.log("Customer ENTER at " + this.time());
            stats.enter(this.time());
            
            this.getBuffer(buffet, 1).done(function () {
                sim.log("Customer at CASHIER " + this.time() + " (entered at " + this.callbackData + ")");
                var serviceTime = random.exponential(1.0 / CashierTime);
                this.useFacility(cashier, serviceTime).done(function () {
                    sim.log("Customer LEAVE at " + this.time() + " (entered at " + this.callbackData + ")");
                    stats.leave(this.callbackData, this.time());
                }).setData(this.callbackData);
            }).setData(this.time());
        }
    };
    
    var Chef = {
        start: function () {
            this.putBuffer(buffet, BuffetCapacity - buffet.current());
            this.setTimer(PreparationTime).done(this.start);
        }
    };
    
    sim.addEntity(Customer);
    sim.addEntity(Chef);
    
//  Uncomment these line to display logging information
//    sim.setLogger(function (msg) {
//        document.write(msg);
//    });
    
    sim.simulate(Simtime);
    
    return [stats.durationSeries.average(),
            stats.durationSeries.deviation(),
            stats.sizeSeries.average(),
            stats.sizeSeries.deviation()];
    
}