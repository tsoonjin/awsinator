get-report-js-test () {
    export AWS_SDK_LOAD_CONFIG="true"
    export AWS_PROFILE="astro-de-prod"
    node ./scripts/gen-report.js
}
