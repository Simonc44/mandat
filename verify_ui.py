from playwright.sync_api import sync_playwright, expect
import time

def verify_legislature_16():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to see more content
        context = browser.new_context(viewport={'width': 1280, 'height': 1200})
        page = context.new_page()

        print("Navigating to legislature-16 page...")
        try:
            # The dev server is running on 8080
            page.goto("http://localhost:8080/legislature-16", wait_until="networkidle", timeout=60000)

            # Wait for some content to be visible
            print("Waiting for heading...")
            expect(page.get_by_role("heading", name="16e législature")).to_be_visible(timeout=30000)

            # Wait a bit for data to load if any
            time.sleep(5)

            print("Taking screenshot...")
            page.screenshot(path="verification_16.png")
            print("Screenshot saved to verification_16.png")

        except Exception as e:
            print(f"Error during verification: {e}")
            # Take a screenshot even on error to see what's happening
            page.screenshot(path="error_verification.png")

        browser.close()

if __name__ == "__main__":
    verify_legislature_16()
