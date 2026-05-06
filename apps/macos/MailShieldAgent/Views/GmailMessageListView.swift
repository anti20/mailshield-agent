import SwiftUI

struct GmailMessageListView: View {
    let messages: [GmailMessageMetadata]
    @Binding var selectedMessageID: GmailMessageMetadata.ID?
    let isLoading: Bool
    let errorMessage: String?
    let loadAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Gmail messages")
                    .font(.headline)

                Spacer()

                Button {
                    loadAction()
                } label: {
                    Label("Load recent Gmail", systemImage: "tray.and.arrow.down")
                }
                .disabled(isLoading)
            }

            if isLoading {
                ProgressView("Loading Gmail messages...")
                    .controlSize(.small)
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            if messages.isEmpty && !isLoading {
                Text("No Gmail messages loaded")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .background(Color(nsColor: .controlBackgroundColor))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            } else {
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(messages) { message in
                            GmailMessageRowView(
                                message: message,
                                isSelected: selectedMessageID == message.id
                            ) {
                                selectedMessageID = message.id
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct GmailMessageRowView: View {
    let message: GmailMessageMetadata
    let isSelected: Bool
    let selectAction: () -> Void

    var body: some View {
        Button {
            selectAction()
        } label: {
            VStack(alignment: .leading, spacing: 8) {
                Text(message.subject)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .lineLimit(2)

                Text(message.sender)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)

                Text(message.snippet)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(12)
            .background(isSelected ? Color.accentColor.opacity(0.16) : Color(nsColor: .controlBackgroundColor))
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}
