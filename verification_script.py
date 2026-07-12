from playwright.sync_api import sync_playwright
import time
import os

def run():
    print("Starting Playwright verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set viewport to standard desktop size
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        url = "http://localhost:8080/"
        print(f"Navigating to {url}...")
        page.goto(url)

        # Wait for the page and elements to load
        print("Waiting for page elements...")
        page.wait_for_selector(".btn-primary", timeout=10000)

        # Let the shader gradient and liquid glass load
        print("Waiting 5 seconds for ShaderGradient and LiquidGlass to initialize...")
        time.sleep(5)

        os.makedirs("/home/jules/verification", exist_ok=True)
        screenshot_path = "/home/jules/verification/verification.png"
        print(f"Taking screenshot to {screenshot_path}...")
        page.screenshot(path=screenshot_path, full_page=False)

        print("Verification complete!")
        browser.close()

if __name__ == "__main__":
    run()
