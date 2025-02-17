using System.Security.Cryptography;
using System.Text;

namespace XCF_Web_Control_Asistencia.Classes
{
    public class cAES
    {
        private static readonly byte[] _key = Encoding.UTF8.GetBytes("tctK8MWY3TTtjrTXyn4cRLPMSqQEVj2n");


        /// <summary>
        /// Encriptar datos.
        /// </summary>
        /// <param name="dato"></param>
        /// <returns></returns>
        public static byte[] Encriptar(string dato)
        {
            return EncryptStringToBytes_Aes(dato, _key, Enumerable.Repeat(0, 16).Select(_ => (byte)new Random().Next(256)).ToArray());
        }


        private static byte[] EncryptStringToBytes_Aes(string plainText, byte[] Key, byte[] IV)
        {
            // Check arguments.
            if (plainText == null || plainText.Length <= 0)
                throw new ArgumentNullException("plainText");
            if (Key == null || Key.Length <= 0)
                throw new ArgumentNullException("Key");
            if (IV == null || IV.Length <= 0)
                throw new ArgumentNullException("IV");

            byte[] encrypted;

            // Create an Aes object
            // with the specified key and IV.
            using (Aes aesAlg = Aes.Create())
            {
                aesAlg.Key = Key;
                aesAlg.IV = IV;

                // Create an encryptor to perform the stream transform.
                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);

                // Create the streams used for encryption.
                using (MemoryStream msEncrypt = new MemoryStream())
                {
                    // Prepend IV to the encrypted data
                    msEncrypt.Write(aesAlg.IV, 0, aesAlg.IV.Length);

                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                        {
                            // Write all data to the stream.
                            swEncrypt.Write(plainText);
                        }
                        encrypted = msEncrypt.ToArray();
                    }
                }
            }

            // Return the encrypted bytes from the memory stream.
            return encrypted;
        }

        /// <summary>
        /// Encriptar a un arreglo de bytes
        /// </summary>
        /// <param name="plainText"></param>
        /// <param name="_key"></param>
        /// <param name="_iv"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentNullException"></exception>
        //public byte[] Encriptar(string plainText, byte[] Key, byte[] IV)
        private static byte[] Encriptar(string dato, byte[] _key, byte[] _iv)
        {
            // Check arguments.
            if (dato == null || dato.Length <= 0)
                throw new ArgumentNullException("plainText");
            //if (_key == null || _key.Length <= 0)
            //    throw new ArgumentNullException("_key");
            //if (_iv == null || _iv.Length <= 0)
            //    throw new ArgumentNullException("_iv");
            byte[] encrypted;


            // Create an Aes object
            // with the specified key and IV.
            using (Aes aesAlg = Aes.Create())
            {
                aesAlg.Key = _key;
                aesAlg.IV = _iv;


                // Create an encryptor to perform the stream transform.
                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, aesAlg.IV);


                // Create the streams used for encryption.
                using (MemoryStream msEncrypt = new MemoryStream())
                {
                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                        {
                            //Write all data to the stream.
                            swEncrypt.Write(dato);
                        }
                        encrypted = msEncrypt.ToArray();
                    }
                }
            }

            // Return the encrypted bytes from the memory stream.
            return encrypted;
        }



        /// <summary>
        /// Desencripta datos.
        /// </summary>
        /// <param name="datoEncriptado"></param>
        /// <returns></returns>
        public static string Desencriptar(byte[] datoEncriptado)
        {
            return DecryptStringFromBytes_Aes(datoEncriptado, _key);
        }

        private static string DecryptStringFromBytes_Aes(byte[] cipherText, byte[] Key)
        {
            // Verificar argumentos.
            if (cipherText == null || cipherText.Length <= 0)
                throw new ArgumentNullException("cipherText");
            if (Key == null || Key.Length <= 0)
                throw new ArgumentNullException("Key");

            // Declarar la cadena que se usará para almacenar el texto descifrado.
            string plaintext = null;

            // Crear un objeto Aes con la clave proporcionada.
            using (Aes aesAlg = Aes.Create())
            {
                aesAlg.Key = Key;

                // Extraer el IV desde el principio del texto cifrado.
                byte[] extractedIV = new byte[aesAlg.IV.Length];
                Array.Copy(cipherText, 0, extractedIV, 0, aesAlg.IV.Length);

                // Establecer el IV extraído en el objeto Aes.
                aesAlg.IV = extractedIV;

                // Crear un transformador de descifrado para realizar la transformación de flujo.
                ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, aesAlg.IV);

                // Crear los flujos utilizados para el descifrado.
                using (MemoryStream msDecrypt = new MemoryStream(cipherText, aesAlg.IV.Length, cipherText.Length - aesAlg.IV.Length))
                {
                    // Crear un CryptoStream para enlazar el flujo de descifrado con el transformador de descifrado.
                    using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                    {
                        // Crear un StreamReader para leer desde el CryptoStream.
                        using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                        {
                            // Leer los bytes descifrados desde el flujo de descifrado y colocarlos en una cadena.
                            plaintext = srDecrypt.ReadToEnd();
                        }
                    }
                }
            }

            // Devolver el texto descifrado.
            return plaintext;
        }
    }
}
