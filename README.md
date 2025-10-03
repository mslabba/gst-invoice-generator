# GST Invoice Generator

This is a simple single-page web application for generating GST invoices. The application allows users to enter buyer and seller details, calculates GST at a rate of 2.5%, and provides an option to download the invoice as a PDF.

## Features

- User-friendly interface for entering buyer and seller information.
- Automatic calculation of GST at 2.5%.
- Option to download the generated invoice as a PDF.
- Responsive design for optimal viewing on various devices.

## Project Structure

```
gst-invoice-generator
├── src
│   ├── index.html          # Main HTML document for the application
│   ├── css
│   │   └── styles.css      # Styles for the application
│   ├── js
│   │   ├── app.js          # Main JavaScript file for handling user interactions
│   │   ├── invoice.js      # Generates invoice details based on user input
│   │   └── pdf-generator.js # Functions for PDF generation
│   └── assets
│       └── fonts           # Custom fonts used in the application
├── package.json            # npm configuration file
└── README.md               # Documentation for the project
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/gst-invoice-generator.git
   ```
2. Navigate to the project directory:
   ```
   cd gst-invoice-generator
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Open `src/index.html` in your web browser.
2. Fill in the buyer and seller details.
3. The application will automatically calculate the GST.
4. Click on the "Download Invoice" button to save the invoice as a PDF.

## Dependencies

- jsPDF: A library for generating PDF documents in JavaScript.

## License

This project is licensed under the MIT License. See the LICENSE file for details.