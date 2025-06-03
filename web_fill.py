"""
#################################################   
            AITINERARY DEMO SCRIPT
#################################################

Capstone Initial Script to show form filling capabilities on booking.com

This script will search for all visible text input fields and fill them with 'CAPSTONE TEST'

Assumptions: 
- Chrome is the browser being used (will need to be updated for other browsers)
- The user has already installed the necessary dependencies (selenium, webdriver-manager, etc.)
- The user has already downloaded the Chrome driver
- The user has already set the Chrome driver path

We can get around this by running on a cloud service, where it isn't reliant at all on the local machine.

Future Improvements:
    Add more intelligent ways to 
    - find and fill input fields
    - handle popups and other input fields (date, guests, etc.)
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
import time
import logging

# set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BookingFormFiller:
    """Booking Class assuming Google Chrome is being used"""
    def __init__(self, headless=False):
        """Initialize the web driver with chrome options"""
        self.driver = None
        self.wait = None
        self.setup_driver(headless)
    
    def setup_driver(self, headless):
        """
        Set up Chrome WebDriver with appropriate options
        
        @PARAMS:
            - headless -> boolean, if True, the browser will not open visually
        """
        chrome_options = Options()
        # add headless mode if user requests
        if headless:
            chrome_options.add_argument("--headless")

        # other necessary options for chrome driver
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        try:
            # initialize the chrome driver
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            self.wait = WebDriverWait(self.driver, 10)
            logger.info("Chrome WebDriver initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize WebDriver: {e}")
            raise
    
    def go_to_booking(self):
        """
        Function to navigate to booking.com.

        @PARAMS:
            - None
        """
        try:
            logger.info("Navigating to booking.com...")
            self.driver.get("https://www.booking.com")
            # wait for the page to load (this will be one of our more difficult challenges to handle in the coming weeks (automating this))
            time.sleep(3)
            logger.info("Successfully loaded booking.com")
        except Exception as e:
            logger.error(f"Failed to load booking.com: {e}")
            raise
    
    def close_popups(self):
        """Close any popup dialogs that might appear"""
        try:
            """
            Common popup selectors on booking.com to close if applicable. 

            As reference this is an example of what it could look like in HTML:

                <button aria-label="Dismiss sign-in info." class="close-btn">×</button>
                <div class="bui-modal__close">Close</div>
                <button data-testid="header-sign-in-dismiss">Dismiss</button>
            """
            popup_selectors = [
                "button[aria-label='Dismiss sign-in info.']",
                "button[data-testid='header-sign-in-dismiss']",
                ".bui-modal__close",
                "[data-testid='modal-close']",
                "button.bui-modal__close",
                "[aria-label='Close']"
            ]
            
            # loop through each of the popup selectors and close if found
            for selector in popup_selectors:
                try:
                    popup = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if popup.is_displayed():
                        # can click easily in the driver functions
                        popup.click()
                        logger.info(f"Closed popup with selector: {selector}")
                        # wait for the popup to close
                        time.sleep(1)
                except NoSuchElementException:
                    continue
        except Exception as e:
            logger.warning(f"Error while closing popups: {e}") 
    
    def fill_all_text_inputs(self):
        """Function to find and fill all visible text input fields with 'CAPSTONE TEST'"""
        try:
            logger.info("Looking for all text input fields...")
            
            # guess what selectors we're looking for (need to think of more intelligent ways to do this in the future)
            input_selectors = [
                "input[type='text']",
                "input[type='email']", 
                "input[type='search']",
                "input:not([type='hidden']):not([type='submit']):not([type='button'])",
                "textarea"
            ]
            
            # temp variable to count how many fields we've filled
            filled_count = 0

            # loop through each selector and fill it with 'CAPSTONE TEST' if found
            for selector in input_selectors:
                try:
                    inputs = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for input_field in inputs:
                        # check if the input field is displayed, enabled, and not readonly
                        if (input_field.is_displayed() and 
                            input_field.is_enabled() and 
                            not input_field.get_attribute('readonly')):

                            # if the input field is empty, clear it and fill it with 'CAPSTONE TEST'
                            current_value = input_field.get_attribute('value')
                            if not current_value or current_value.strip() == '':
                                # similar to the popup closers, we can clear and send keys easily in the driver functions
                                input_field.clear()
                                input_field.send_keys("CAPSTONE TEST")
                                filled_count += 1
                                logger.info(f"Filled input field with 'CAPSTONE TEST'")
                                # wait for the input to be filled
                                time.sleep(0.5)
                except Exception as e:
                    logger.warning(f"Error with input selector {selector}: {e}")
                    continue
            
            logger.info(f"Total fields filled: {filled_count}")
            
        except Exception as e:
            logger.error(f"Error filling text inputs: {e}")

    def cleanup(self):
        """Function to close the web driver, good practice to do this when done."""
        if self.driver:
            self.driver.quit()
            logger.info("WebDriver closed")
    
    def run(self):
        """Main function to run the script."""
        try:
            self.go_to_booking()
            self.close_popups()
            time.sleep(2)
            self.fill_all_text_inputs()
            
            logger.info("Form filling completed. Browser will stay open for 10 seconds...")
            # wait for 10 seconds to review the results
            time.sleep(10)
            
        except Exception as e:
            logger.error(f"Script execution failed: {e}")
        finally:
            # close the web driver when 10 seconds are up
            self.cleanup()

######## RUN THE SCRIPT ########
print("=" * 30)
print("Booking.com Form Filler")
print("=" * 30)
print("This script will:")
print("1. Open booking.com")
print("2. Fill visible form fields with 'CAPSTONE TEST'")
print("3. Keep the browser open for 10 seconds for review")
print()

# headless mode input, headless just means the browser window won't open visually
headless_choice = input("Run in headless mode? (y/n, default=n): ").lower().strip()
form_filler = BookingFormFiller(headless=headless_choice == 'y').run()