import SwiftUI

struct EmailListView: View {
    let scanResults: [EmailScanResult]
    @Binding var selectedScanResultID: EmailScanResult.ID?
    let isLoading: Bool
    let errorMessage: String?
    let loadAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent scans")
                    .font(.headline)

                Spacer()

                Button {
                    loadAction()
                } label: {
                    Label("Load mock scans", systemImage: "tray.and.arrow.down")
                }
                .disabled(isLoading)
            }

            if isLoading {
                ProgressView("Loading scans...")
                    .controlSize(.small)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            if scanResults.isEmpty && !isLoading {
                Text("No scans loaded")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(scanResults) { scanResult in
                            EmailListRowView(
                                scanResult: scanResult,
                                isSelected: selectedScanResultID == scanResult.id
                            ) {
                                selectedScanResultID = scanResult.id
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct EmailListRowView: View {
    let scanResult: EmailScanResult
    let isSelected: Bool
    let selectAction: () -> Void

    var body: some View {
        Button {
            selectAction()
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(scanResult.subject)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .lineLimit(2)

                    Spacer()
                }

                Text(scanResult.sender)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                RiskBadgeView(riskLevel: scanResult.riskLevel, riskScore: scanResult.riskScore)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(isSelected ? Color.accentColor.opacity(0.16) : Color(nsColor: .controlBackgroundColor))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}
