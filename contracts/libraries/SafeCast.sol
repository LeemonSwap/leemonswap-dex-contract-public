//SPDX-License-Identifier: UNLICENSED

pragma solidity >=0.8.0;

library SafeCast {
    function toUint160(uint256 y) internal pure returns (uint160 z) {
        require((z = uint160(y)) == y);
    }

    function toUint128(uint256 y) internal pure returns (uint128 z) {
        require((z = uint128(y)) == y);
    }

    function toInt64(uint256 value) internal pure returns (int64) {
        // Note: Unsafe cast below is okay because `type(int256).max` is guaranteed to be positive
        require(
            value <= uint256(uint64(type(int64).max)),
            "SafeCast: value doesn't fit in an int64"
        );
        return int64(uint64(value));
    }

    function toUint64(uint256 value) internal pure returns (uint64) {
        require(
            value <= type(uint64).max,
            "SafeCast: value doesn't fit in 64 bits"
        );
        return uint64(value);
    }
}
