export async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function firstDayPreviousMonth(originalDate) {
    // this is freaking brilliant
    var d = new Date(originalDate);
    d.setDate(0); // set to last day of previous month
    d.setDate(1); // set to the first day of that month
    return d;
}