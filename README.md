# 0r4cl3
## Getting started
### Installation
1. Install `python3` (tested with Python 3.7.2)
2. Install `node` and `npm` (tested with NodeJS 12.18.3 LTS)
3. Install [Wireshark](https://www.wireshark.org/) and ensure that it's added to `PATH`
4. Clone the repository and install the required dependencies (for both Python and NodeJS)
   ```
   $ pip3 install -r requirements.txt
   $ npm install
   ```

### Run
- `0r4cl3` requires the environment variable `ACCESS_TOKEN` to be set to authenticate users
- `0r4cl3` requires the environment variable `SNIFFER_INTERFACE` to be set to capture network traffic
- `0r4cl3` requires root privileges to capture network traffic
- Once everything has been started, `0r4cl3` should be accessible on port `5000`

#### Production environment
1. Build the frontend
   ```
   # npm run prod
   ```
2. Start the backend
   ```
   # ACCESS_TOKEN="<ACCESS TOKEN>" SNIFFER_INTERFACE="<INTERFACE>" python3 -m src.main
   ```

#### Development environment
```
# ACCESS_TOKEN="<ACCESS TOKEN>" SNIFFER_INTERFACE="<INTERFACE>" npm run dev
```
