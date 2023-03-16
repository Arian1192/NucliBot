export const getOnlyBookingsAvailable = (bookings) => {
    let bookingsAvailable = []
    bookings.map((booking) => {
        if(booking.score === 1){
            bookingsAvailable.push(booking)
        }
    })
    return bookingsAvailable
}