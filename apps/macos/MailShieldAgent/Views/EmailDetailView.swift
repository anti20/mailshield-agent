import SwiftUI

struct EmailDetailView: View {
    let scanResult: EmailScanResult?

    var body: some View {
        Group {
            if let scanResult {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        header(for: scanResult)

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Summary")
                                .font(.headline)

                            Text(scanResult.summary)
                                .foregroundStyle(.secondary)
                        }

                        VStack(alignment: .leading, spacing: 10) {
                            Text("Agent checks")
                                .font(.headline)

                            ForEach(scanResult.checks) { check in
                                AgentCheckRowView(check: check)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Agent checks")
                        .font(.headline)

                    Text("Select a scan to review agent findings.")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(14)
                .background(Color(nsColor: .controlBackgroundColor))
                .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }

    private func header(for scanResult: EmailScanResult) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(scanResult.subject)
                .font(.title2)
                .fontWeight(.semibold)

            Text(scanResult.sender)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            RiskBadgeView(riskLevel: scanResult.riskLevel, riskScore: scanResult.riskScore)
        }
    }
}
