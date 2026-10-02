#pragma once

#include <cstdint>
#include <vector>
#include <string>
#include <stdexcept>
#include <cstring>

namespace compression {

/**
 * @brief BitWriter enables writing variable-length bit sequences (from 1 to 32 bits)
 * into a dynamically expanding byte buffer.
 * Bits are written Most-Significant-Bit (MSB) first by default.
 */
class BitWriter {
public:
    BitWriter() : bit_buffer_(0), bit_count_(0) {}

    /**
     * @brief Writes 'num_bits' from 'value' (MSB first).
     * @param value The integer containing the bits to write.
     * @param num_bits Number of bits to extract (1 to 32).
     */
    void write_bits(uint32_t value, uint8_t num_bits) {
        if (num_bits == 0) return;
        if (num_bits > 32) throw std::invalid_argument("Cannot write more than 32 bits at once");

        // Mask off unused high bits
        if (num_bits < 32) {
            value &= ((1u << num_bits) - 1u);
        }

        // Shift into buffer
        for (int i = num_bits - 1; i >= 0; --i) {
            uint8_t bit = (value >> i) & 1u;
            bit_buffer_ = (bit_buffer_ << 1) | bit;
            bit_count_++;

            if (bit_count_ == 8) {
                bytes_.push_back(static_cast<uint8_t>(bit_buffer_));
                bit_buffer_ = 0;
                bit_count_ = 0;
            }
        }
    }

    /**
     * @brief Writes a single bit (0 or 1).
     */
    void write_bit(uint8_t bit) {
        write_bits(bit & 1u, 1);
    }

    /**
     * @brief Writes a full byte directly.
     */
    void write_byte(uint8_t byte) {
        write_bits(byte, 8);
    }

    /**
     * @brief Flushes any remaining unwritten bits in the buffer by padding with zeros to a byte boundary.
     * @return Number of padding bits added (0-7).
     */
    uint8_t flush(uint8_t pad_bit = 0) {
        if (bit_count_ == 0) return 0;
        uint8_t pad_count = 8 - bit_count_;
        bit_buffer_ <<= pad_count;
        if (pad_bit) {
            bit_buffer_ |= ((1u << pad_count) - 1u);
        }
        bytes_.push_back(static_cast<uint8_t>(bit_buffer_));
        bit_buffer_ = 0;
        bit_count_ = 0;
        return pad_count;
    }

    /**
     * @brief Access the accumulated encoded byte vector.
     */
    const std::vector<uint8_t>& data() const { return bytes_; }
    std::vector<uint8_t>& data() { return bytes_; }

    /**
     * @brief Total number of fully written bytes.
     */
    size_t size_bytes() const { return bytes_.size(); }

    /**
     * @brief Total number of bits written so far (including buffered bits).
     */
    size_t total_bits_written() const { return bytes_.size() * 8 + bit_count_; }

    void clear() {
        bytes_.clear();
        bit_buffer_ = 0;
        bit_count_ = 0;
    }

private:
    std::vector<uint8_t> bytes_;
    uint32_t bit_buffer_;
    uint8_t bit_count_;
};

/**
 * @brief BitReader reads variable-length bit sequences (1 to 32 bits)
 * sequentially from an in-memory byte buffer.
 */
class BitReader {
public:
    BitReader(const uint8_t* data, size_t size_bytes)
        : data_(data), size_bytes_(size_bytes), byte_pos_(0), bit_buffer_(0), bits_in_buffer_(0) {}

    explicit BitReader(const std::vector<uint8_t>& buffer)
        : BitReader(buffer.data(), buffer.size()) {}

    /**
     * @brief Reads a single bit (0 or 1).
     */
    uint8_t read_bit() {
        return static_cast<uint8_t>(read_bits(1));
    }

    /**
     * @brief Reads 'num_bits' (MSB first) from the stream.
     * @param num_bits Number of bits to read (1 to 32).
     */
    uint32_t read_bits(uint8_t num_bits) {
        if (num_bits == 0) return 0;
        if (num_bits > 32) throw std::invalid_argument("Cannot read more than 32 bits at once");

        while (bits_in_buffer_ < num_bits) {
            if (byte_pos_ >= size_bytes_) {
                throw std::out_of_range("BitReader: Unexpected End-Of-Stream while reading bits");
            }
            bit_buffer_ = (bit_buffer_ << 8) | data_[byte_pos_++];
            bits_in_buffer_ += 8;
        }

        uint8_t shift = bits_in_buffer_ - num_bits;
        uint32_t mask = (num_bits == 32) ? 0xFFFFFFFFu : ((1u << num_bits) - 1u);
        uint32_t result = (bit_buffer_ >> shift) & mask;
        bits_in_buffer_ -= num_bits;
        return result;
    }

    /**
     * @brief Reads a full byte.
     */
    uint8_t read_byte() {
        return static_cast<uint8_t>(read_bits(8));
    }

    /**
     * @brief Check whether there are more bits available to read.
     */
    bool has_more_bits() const {
        return (byte_pos_ < size_bytes_) || (bits_in_buffer_ > 0);
    }

    /**
     * @brief Returns remaining bits available in the stream.
     */
    size_t remaining_bits() const {
        return (size_bytes_ - byte_pos_) * 8 + bits_in_buffer_;
    }

private:
    const uint8_t* data_;
    size_t size_bytes_;
    size_t byte_pos_;
    uint64_t bit_buffer_;
    uint8_t bits_in_buffer_;
};

} // namespace compression
