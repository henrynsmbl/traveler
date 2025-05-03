// Add a new function to update hotel dates
export const updateHotelDates = async (userId, hotelId, dates) => {
  try {
    const userRef = doc(db, 'users', userId);
    const hotelDatesRef = doc(userRef, 'hotelDates', hotelId);
    
    // Convert dates to Firestore Timestamps
    const firestoreDates = {
      from: dates.from,
      to: dates.to
    };
    
    await setDoc(hotelDatesRef, firestoreDates);
    return true;
  } catch (error) {
    console.error('Error updating hotel dates:', error);
    return false;
  }
};

// Modify the getSelections function to properly handle date objects
export const getSelections = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const selectionsCollection = collection(userRef, 'selections');
    const hotelDatesCollection = collection(userRef, 'hotelDates');
    
    // Get all selections
    const selectionsSnapshot = await getDocs(selectionsCollection);
    const selections = selectionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get hotel dates
    const hotelDatesSnapshot = await getDocs(hotelDatesCollection);
    const hotelDates = {};
    
    hotelDatesSnapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to Date objects
      hotelDates[doc.id] = {
        from: data.from instanceof Timestamp ? data.from.toDate() : new Date(data.from),
        to: data.to instanceof Timestamp ? data.to.toDate() : new Date(data.to)
      };
    });
    
    return { selections, hotelDates };
  } catch (error) {
    console.error('Error fetching selections:', error);
    return { selections: [], hotelDates: {} };
  }
}; 