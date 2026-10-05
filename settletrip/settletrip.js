import usermodel from "../db/usermodel.js"
import tripmodel from "../db/tripmodel.js"
import settlemodel from "../db/settlement.js"
import { MinHeap, MaxHeap } from "./heaps.js"

const settlefunc = async(req)=>{
    let balances = req.body.balances
    console.log("balances: ", balances)
    let minhp = new MinHeap(balances)
    let maxhp = new MaxHeap(balances)
    let s = []
    let settled = false;
    console.log("top: ", minhp.top())
    while (true) {
        let minn = minhp.top()
        minhp.pop();
        let maxx = maxhp.top();
        maxhp.pop()
        if(maxx===null||minn===null){
            settled = true
            break
        }
        if(maxx.bal===0&&minn.bal===0){
            settled = true;
            break;
        }
        let dega = Math.min(Math.abs(maxx.bal), Math.abs(minn.bal))
        s.push({ "p": minn.uid, "r": maxx.uid, "amt": dega, paid: false })
        if(minn.bal+dega!=0){
            minn.bal+= dega;
            minhp.push(minn)
        }
        if(maxx.bal-dega!=0){
            maxx.bal-=dega;
            maxhp.push(maxx)
        }
    }
    console.log("s : ",s)
    if(!settled) {
        return { success: false }
    }
    await settlemodel.insertOne({ tripCode: req.body.tripCode, s: s })
    const members = req.body.members
    await tripmodel.updateOne({ tripCode: req.body.tripCode }, { $set: { freezed: true } })
    for (let u of members) {
        await usermodel.updateOne({ email: u.uid, "trips.trcode": req.body.tripCode }, { $set: { "trips.$.freezed": true } })
    }
    return {
        success: true,
        stlmnt: s
    }
}

export default settlefunc


// let min = balances[0]
        // let minI = 0;
        // for (let i = 0; i < balances.length; i++) {
        //     if (balances[i].bal < min.bal) {
        //         min = balances[i]
        //         minI = i;
        //     }
        // }
        // let max = balances[0]
        // let maxI = 0;
        // for (let j = 0; j < balances.length; j++) {
        //     if (balances[j].bal > max.bal) {
        //         max = balances[j]
        //         maxI = j;
        //     }
        // }


         // balances[minI].bal += dega
        // balances[maxI].bal -= dega