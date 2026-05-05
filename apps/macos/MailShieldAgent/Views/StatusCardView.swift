import SwiftUI

struct StatusCardView: View {
    let status: String
    let serviceName: String?
    let lastCheckedAt: Date?
    let errorMessage: String?
    let isChecking: Bool
    let checkAction: () -> Void

    private var statusColor: Color {
        switch status {
        case "Online":
            .green
        case "Offline":
            .red
        case "Checking":
            .orange
        default:
            .secondary
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: "server.rack")
                    .font(.title2)
                    .foregroundStyle(statusColor)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Backend status: \(status)")
                        .font(.headline)

                    if let serviceName {
                        Text("Service: \(serviceName)")
                            .foregroundStyle(.secondary)
                    }

                    if let lastCheckedAt {
                        Text("Last checked: \(lastCheckedAt, style: .time)")
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                if isChecking {
                    ProgressView()
                        .controlSize(.small)
                }
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            Button {
                checkAction()
            } label: {
                Label("Check backend", systemImage: "arrow.clockwise")
            }
            .disabled(isChecking)
        }
        .padding(16)
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
