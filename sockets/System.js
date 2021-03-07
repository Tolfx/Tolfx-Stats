module.exports = (socket) => {
    if(typeof socket.request.session.passport != "undefined")
    {
        if(typeof socket.request.session.passport.user != "undefined")
        {
            let interval = setInterval(() => {
                //Needs more work..
                let cpu = process.cpuUsage().system
                let cpupercent = Math.round(cpu / 10000) / 10;
                const ram = process.memoryUsage().heapUsed / 1024 / 1024;
                let rampercent = Math.round(ram * 100) / 100;
                let data = {
                    RAM: rampercent,
                    CPU: cpupercent
                }
                socket.emit("system", JSON.stringify(data))
                if(!socket.connected)
                {
                    clearInterval(interval)
                }
            }, 3000)
        }
    }
}