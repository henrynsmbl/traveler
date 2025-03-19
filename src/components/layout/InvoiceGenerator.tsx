import React, { useState } from 'react';
import type { Selection, ActivitySelection } from '../../types/selections';
import type { FlightData, Flight, Layover } from '../../types/flight';
import type { HotelData } from '../../types/hotel';
import type { DateRange } from "react-day-picker";
import { jsPDF } from 'jspdf';

interface HotelDates {
  [hotelId: string]: DateRange | undefined;
}

interface InvoiceGeneratorProps {
  selections: Selection[];
  hotelDates: HotelDates;
}

const formatDate = (dateTimeStr: string) => {
  try {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', dateTimeStr, error);
    return dateTimeStr;
  }
};

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ selections, hotelDates }) => {
  const [showAlert, setShowAlert] = useState(false);

  const checkHotelDates = () => {
    const hotelSelections = selections.filter(s => s.type === 'hotel');
    return hotelSelections.every(selection => hotelDates[selection.id]?.from && hotelDates[selection.id]?.to);
  };

  const handleGenerateClick = () => {
    if (!checkHotelDates()) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      return;
    }
    generatePDF();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      const cleanText = text
        .replace(/→/g, 'to')
        .replace(/₂/g, '2')
        .replace(/'/g, "'")
        .replace(/'/g, "'");

      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.text(cleanText, margin, yPos);
      yPos += fontSize * 0.4;
    };

    const addNewLine = (space: number = 5) => {
      yPos += space;
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TRAVEL AITINERARY', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    yPos += 20;

    // Flights Section
    const flightSelections = selections.filter(s => s.type === 'flight');
    if (flightSelections.length > 0) {
      addText('FLIGHTS', 16, true);
      addText('----------------', 16);
      addNewLine();

      flightSelections.forEach(selection => {
        const flightData = selection.data as FlightData;
        
        addText(`${flightData.flights[0].departure_airport.name} to ${flightData.flights[flightData.flights.length - 1].arrival_airport.name}`, 14, true);
        addNewLine();

        flightData.flights.forEach((flight: Flight, index: number) => {
          addText(`Flight: ${flight.airline} ${flight.flight_number}`);
          addText(`Departure: ${formatDate(flight.departure_airport.time)}`);
          addText(`Time: ${flight.departure_airport.time.split(' ')[1]}`);
          addText(`From: ${flight.departure_airport.name} (${flight.departure_airport.id})`);
          addNewLine(3);
          addText(`Arrival: ${formatDate(flight.arrival_airport.time)}`);
          addText(`Time: ${flight.arrival_airport.time.split(' ')[1]}`);
          addText(`To: ${flight.arrival_airport.name} (${flight.arrival_airport.id})`);
          addText(`Duration: ${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m`);
          addText(`Class: ${flight.travel_class}`);
          if (flight.overnight) {
            addText('Note: Overnight flight');
          }

          if (flightData.layovers?.[index]) {
            const layover = flightData.layovers[index] as Layover;
            addText(`Layover at ${layover.name}: ${Math.floor(layover.duration / 60)}h ${layover.duration % 60}m`);
            if (layover.overnight) {
              addText('Note: Overnight layover');
            }
          }
          addNewLine();
        });

        addText(`Total Flight Price: $${flightData.price.toFixed(2)}`, 12, true);
        if (flightData.carbon_emissions) {
          addText(`Carbon Emissions: ${(flightData.carbon_emissions.this_flight / 1000).toFixed(1)}kg CO2`);
        }
        addNewLine(10);
      });
    }

    // Hotels Section
    const hotelSelections = selections.filter(s => s.type === 'hotel');
    if (hotelSelections.length > 0) {
      addText('HOTELS', 16, true);
      addText('----------------', 16);
      addNewLine();

      hotelSelections.forEach(selection => {
        const hotelData = selection.data as HotelData;
        const dates = hotelDates[selection.id];

        addText(hotelData.name, 12, true);

        if (dates?.from && dates?.to && hotelData.rate_per_night?.lowest) {
          const nights = Math.ceil((dates.to.getTime() - dates.from.getTime()) / (1000 * 60 * 60 * 24));
          const nightlyRate = parseFloat(hotelData.rate_per_night.lowest.replace(/[^0-9.]/g, ''));
          const totalHotelCost = nightlyRate * nights;

          addText(`Check-in: ${dates.from.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`);
          addText(`Check-out: ${dates.to.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`);
          addText(`Nightly Rate: $${nightlyRate.toFixed(2)}`);
          addText(`Total for ${nights} nights: $${totalHotelCost.toFixed(2)}`, 12, true);
        }
        addNewLine(10);
      });
    }

    // After hotels section, add activities section
    const activitySelections = selections.filter(s => s.type === 'activity');
    if (activitySelections.length > 0) {
      addText('ACTIVITIES', 16, true);
      addText('----------------', 16);
      addNewLine(5);

      activitySelections.forEach(selection => {
        const activityData = selection.data as ActivitySelection['data'];
        addText('Activity:', 12, true);
        
        // Split long descriptions into multiple lines
        const words = activityData.description.split(' ');
        let line = '';
        words.forEach(word => {
          if ((line + word).length > 60) {
            addText(line, 12);
            line = word + ' ';
          } else {
            line += word + ' ';
          }
        });
        if (line) addText(line.trim(), 12);
        
        addNewLine(3);

        if (activityData.notes) {
          addText('Notes:', 12, true);
          // Split notes into lines and add them
          const noteLines = activityData.notes.split('\n');
          noteLines.forEach(noteLine => {
            const words = noteLine.split(' ');
            let line = '';
            words.forEach(word => {
              if ((line + word).length > 60) {
                addText(line, 12);
                line = word + ' ';
              } else {
                line += word + ' ';
              }
            });
            if (line) addText(line.trim(), 12);
          });
          addNewLine(3);
        }
        
        addText(`Price: TBD`, 12, true);
        addNewLine(10);
      });
    }

    // Total
    const totalCost = [...flightSelections, ...hotelSelections].reduce((acc, selection) => {
      if (selection.type === 'flight') {
        return acc + (selection.data as FlightData).price;
      } else {
        const hotelData = selection.data as HotelData;
        const dates = hotelDates[selection.id];
        if (dates?.from && dates?.to && hotelData.rate_per_night?.lowest) {
          const nights = Math.ceil((dates.to.getTime() - dates.from.getTime()) / (1000 * 60 * 60 * 24));
          const nightlyRate = parseFloat(hotelData.rate_per_night.lowest.replace(/[^0-9.]/g, ''));
          return acc + (nightlyRate * nights);
        }
        return acc;
      }
    }, 0);

    addNewLine();
    addText('----------------', 16);
    addText(`TOTAL COST: $${totalCost.toFixed(2)}`, 16, true);

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="space-y-2">
      {showAlert && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">
          Please select dates for all hotels before generating the itinerary.
        </div>
      )}
      <button
        onClick={handleGenerateClick}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg mt-2"
      >
        View Itinerary
      </button>
    </div>
  );
};

export default InvoiceGenerator;